from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.staticfiles import StaticFiles
import uvicorn
from ultralytics import YOLO
import easyocr
import cv2
import numpy as np
from PIL import Image
import io
import os
import shutil
import uuid
import datetime
from sqlalchemy import func, Float
import sqlalchemy
import pandas as pd

# Import Database Models
from database import SessionLocal, engine, init_db, Owner, Vehicle, Detection

# Initialize DB Tables
init_db()

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Mount uploads directory to serve images
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Load Models
# YOLOv8n (nano) is small and fast. It will download on first run.
model = YOLO('yolov8n.pt') 
reader = easyocr.Reader(['en'])

# Load Specialized Plate Model (if available)
plate_model = None
try:
    if os.path.exists('specialized_plate_detector.pt'):
        plate_model = YOLO('specialized_plate_detector.pt')
        print("Loaded specialized plate detection model.")
    else:
        print("Warning: specialized_plate_detector.pt not found. Using fallback detection.")
except Exception as e:
    print(f"Error loading plate model: {e}")

@app.get("/")
def read_root():
    return {"status": "ok", "model": "yolov8n", "database": "active"}

# --- Database Endpoints ---

@app.post("/api/owners")
async def create_owner(
    name: str = Form(...),
    contact_info: str = Form(...),
    photo: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    photo_path = ""
    if photo:
        file_extension = photo.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        photo_path = f"/uploads/{filename}"

    new_owner = Owner(name=name, contact_info=contact_info, photo_path=photo_path)
    db.add(new_owner)
    db.commit()
    db.refresh(new_owner)
    return new_owner

@app.get("/api/owners")
def get_owners(db: Session = Depends(get_db)):
    return db.query(Owner).all()

@app.post("/api/vehicles")
def create_vehicle(
    license_plate: str,
    make_model: str,
    owner_id: int,
    db: Session = Depends(get_db)
):
    # Check if owner exists
    owner = db.query(Owner).filter(Owner.id == owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")

    new_vehicle = Vehicle(license_plate=license_plate.upper(), make_model=make_model, owner_id=owner_id)
    try:
        db.add(new_vehicle)
        db.commit()
        db.refresh(new_vehicle)
        return new_vehicle
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Vehicle with this plate likely already exists")

@app.get("/api/vehicles")
def get_vehicles(db: Session = Depends(get_db)):
    return db.query(Vehicle).all()

@app.get("/api/vehicles/{vehicle_id}/history")
def get_vehicle_history(vehicle_id: int, db: Session = Depends(get_db)):
    # Find vehicle first to ensure it exists
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    # Get detections for this vehicle based on license plate match
    # linking by known_vehicle_id or license_plate string match
    # Ideally, we should rely on known_vehicle_id if populated, or fallback to plate string
    return db.query(Detection).filter(
        (Detection.known_vehicle_id == vehicle_id) | 
        (Detection.license_plate == vehicle.license_plate)
    ).order_by(Detection.timestamp.desc()).all()

@app.post("/api/register")
async def register_full(
    name: str = Form(...),
    contact_info: str = Form(...),
    license_plate: str = Form(...),
    make_model: str = Form(...),
    photo: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    # 1. Handle Photo Upload
    photo_path = ""
    if photo:
        file_extension = photo.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        photo_path = f"/uploads/{filename}"

    try:
        # 2. Create Owner
        new_owner = Owner(name=name, contact_info=contact_info, photo_path=photo_path)
        db.add(new_owner)
        db.flush() # Flush to get the ID, but don't commit yet in case vehicle fails

        # 3. Create Vehicle
        # Check if plate exists
        existing_vehicle = db.query(Vehicle).filter(Vehicle.license_plate == license_plate.upper()).first()
        if existing_vehicle:
            db.rollback()
            raise HTTPException(status_code=400, detail="License plate already registered")

        new_vehicle = Vehicle(
            license_plate=license_plate.upper(), 
            make_model=make_model, 
            owner_id=new_owner.id
        )
        db.add(new_vehicle)
        
        # 4. Commit transaction
        db.commit()
        db.refresh(new_owner)
        
        return {"status": "success", "owner": new_owner, "vehicle": new_vehicle}

    except Exception as e:
        db.rollback()
        print(f"Registration error: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
def get_history(db: Session = Depends(get_db)):
    return db.query(Detection).order_by(Detection.timestamp.desc()).limit(50).all()

@app.get("/api/summary")
def get_summary(db: Session = Depends(get_db)):
    total_vehicles = db.query(func.count(Detection.id)).scalar() or 0
    total_revenue = db.query(func.sum(Detection.toll_amount)).scalar() or 0
    
    # Average confidence (convert string confidence to float if necessary, 
    # but the model saves it as string in database.py, so we cast)
    avg_confidence = db.query(func.avg(Detection.confidence.cast(Float))).scalar() or 0
    
    pending_review = db.query(func.count(Detection.id)).filter(Detection.status == 'pending_review').scalar() or 0
    
    return {
        "total_vehicles": total_vehicles,
        "total_revenue": float(total_revenue),
        "avg_confidence": round(float(avg_confidence) * 100, 1),
        "pending_review": pending_review
    }

@app.get("/api/analytics")
def get_analytics(db: Session = Depends(get_db)):
    # 1. Revenue and Volume by Day (Past 7 Days)
    today = datetime.datetime.utcnow().date()
    seven_days_ago = today - datetime.timedelta(days=7)
    
    daily_stats = db.query(
        func.date(Detection.timestamp).label('date'),
        func.sum(Detection.toll_amount).label('revenue'),
        func.count(Detection.id).label('volume')
    ).filter(Detection.timestamp >= seven_days_ago).group_by(func.date(Detection.timestamp)).all()
    
    revenue_trend = []
    for d in range(7, -1, -1):
        day = today - datetime.timedelta(days=d)
        day_str = day.isoformat()
        match = next((item for item in daily_stats if item.date == day_str), None)
        revenue_trend.append({
            "date": day_str,
            "revenue": match.revenue if match else 0,
            "volume": match.volume if match else 0
        })

    # 2. Hourly Traffic (Current Day)
    hourly_stats = db.query(
        func.strftime('%H', Detection.timestamp).label('hour'),
        func.count(Detection.id).label('count')
    ).filter(func.date(Detection.timestamp) == today.isoformat()).group_by(func.strftime('%H', Detection.timestamp)).all()
    
    hourly_traffic = []
    for h in range(24):
        hour_str = f"{h:02d}"
        match = next((item for item in hourly_stats if item.hour == hour_str), None)
        hourly_traffic.append({
            "hour": f"{hour_str}:00",
            "count": match.count if match else 0
        })

    # 3. Vehicle Type Distribution
    type_stats = db.query(
        Detection.vehicle_type,
        func.count(Detection.id).label('count')
    ).group_by(Detection.vehicle_type).all()
    
    vehicle_distribution = [
        {"type": t.vehicle_type, "value": t.count} for t in type_stats
    ]

    # 4. Summary Metrics
    total_stats = db.query(
        func.sum(Detection.toll_amount).label('total_revenue'),
        func.count(Detection.id).label('total_vehicles')
    ).first()

    return {
        "revenueTrend": revenue_trend,
        "hourlyTraffic": hourly_traffic,
        "vehicleDistribution": vehicle_distribution,
        "summary": {
            "totalRevenue": total_stats.total_revenue or 0,
            "totalVehicles": total_stats.total_vehicles or 0,
            "avgRevenue": (total_stats.total_revenue / total_stats.total_vehicles) if total_stats.total_vehicles and total_stats.total_vehicles > 0 else 0
        }
    }

@app.get("/api/review_queue")
def get_review_queue(db: Session = Depends(get_db)):
    return db.query(Detection).filter(Detection.status == 'pending_review').order_by(Detection.timestamp.desc()).all()

@app.put("/api/detections/{detection_id}")
def update_detection(
    detection_id: int,
    vehicle_type: str = Form(...),
    toll_amount: int = Form(...),
    db: Session = Depends(get_db)
):
    detection = db.query(Detection).filter(Detection.id == detection_id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
    
    detection.vehicle_type = vehicle_type
    detection.toll_amount = toll_amount
    detection.status = 'verified'
    
    db.commit()
    db.refresh(detection)
    return detection

@app.delete("/api/detections/{detection_id}")
def delete_detection(detection_id: int, db: Session = Depends(get_db)):
    detection = db.query(Detection).filter(Detection.id == detection_id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
    
    # Delete image file if it exists
    if detection.image_path:
        filename = os.path.basename(detection.image_path)
        full_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
            except Exception as e:
                print(f"Error deleting file: {e}")

    db.delete(detection)
    db.commit()
    return {"status": "success"}

@app.get("/api/vehicle/status/{license_plate}")
def get_vehicle_status(license_plate: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.license_plate == license_plate.upper()).first()
    
    # Get all detections for this plate (verified and pending)
    # Note: Using relaxed matching logic similar to history
    detections = db.query(Detection).filter(
        (Detection.license_plate == license_plate.upper()) |
        (Detection.known_vehicle_id == (vehicle.id if vehicle else -1))
    ).all()

    total_due = sum(d.toll_amount for d in detections)
    
    return {
        "found": vehicle is not None,
        "vehicle": vehicle,
        "owner": vehicle.owner if vehicle else None,
        "total_due": total_due,
        "history_count": len(detections)
    }

@app.post("/api/import")
async def import_data(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        contents = await file.read()
        df = None
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Invalid file type. Only CSV and Excel are supported.")

        required_columns = ['Full Name', 'Contact Info', 'License Plate', 'Make & Model']
        # Normalize columns (case insensitive, strip whitespace)
        df.columns = [c.strip() for c in df.columns]
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(status_code=400, detail=f"Missing columns: {', '.join(missing_columns)}")

        success_count = 0
        error_count = 0
        errors = []

        for index, row in df.iterrows():
            try:
                name = str(row['Full Name']).strip()
                contact = str(row['Contact Info']).strip()
                plate = str(row['License Plate']).strip().upper()
                model = str(row['Make & Model']).strip()

                if not name or not plate:
                    continue

                # Check if plate exists
                existing_vehicle = db.query(Vehicle).filter(Vehicle.license_plate == plate).first()
                if existing_vehicle:
                    error_count += 1
                    errors.append(f"Row {index+2}: Plate {plate} already exists")
                    continue

                # Create Owner (Check if owner with same name and contact exists to avoid duplicates?)
                # For now, let's just create a new owner for simplicity as per standard registry behavior
                new_owner = Owner(name=name, contact_info=contact, photo_path="")
                db.add(new_owner)
                db.flush()

                new_vehicle = Vehicle(
                    license_plate=plate,
                    make_model=model,
                    owner_id=new_owner.id
                )
                db.add(new_vehicle)
                success_count += 1
            except Exception as e:
                error_count += 1
                errors.append(f"Row {index+2}: {str(e)}")

        db.commit()
        return {
            "status": "success",
            "imported": success_count,
            "failed": error_count,
            "errors": errors[:10] # Return first 10 errors
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Import error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Analysis Endpoint ---

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        # Convert to openCV format (numpy array)
        img_np = np.array(image)
        img_cv = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

        # Run YOLO detection
        results = model(img_cv)
        
        vehicle_type = "Unknown"
        confidence = 0.0
        
        # classes for vehicles in COCO dataset
        # 2: car, 3: motorcycle, 5: bus, 7: truck
        vehicle_classes = [2, 3, 5, 7]
        coco_map = {2: 'Car', 3: 'Motorcycle', 5: 'Bus', 7: 'Truck'}

        for r in results:
            for b in r.boxes:
                cls_id = int(b.cls[0])
                conf = float(b.conf[0])
                
                if cls_id in vehicle_classes:
                    if conf > confidence:
                        confidence = conf
                        vehicle_type = coco_map[cls_id]

        # --- Hybrid OCR Pipeline ---
        
        import re

        def preprocess_image(img):
            """Applies CLAHE and filters to improve OCR"""
            # Resize if too small
            h, w = img.shape[:2]
            if h < 300:
                scale = 300 / h
                img = cv2.resize(img, (int(w*scale), int(h*scale)), interpolation=cv2.INTER_CUBIC)
            
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # CLAHE (Contrast Limited Adaptive Histogram Equalization)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            contrast = clahe.apply(gray)
            
            # Bilateral Filter (Remove noise, keep edges)
            blur = cv2.bilateralFilter(contrast, 11, 17, 17)
            return blur

        def score_plate(text):
            """Scores a string based on likelihood of being a license plate"""
            text = text.upper().replace(' ', '')
            if len(text) < 4 or len(text) > 12: return -10
            
            # Generic Indian Plate Regex: AA 00 AA 0000
            # Allow for some missing chars or merged chars
            # Patterns:
            # 1. Start with 2 chars (State)
            # 2. 1-2 digits (District)
            # 3. 1-3 chars (Series - optional)
            # 4. 4 digits (Number)
            
            score = 0
            
            # Ideal Pattern Check
            if re.match(r'^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{3,4}$', text):
                score += 100
            elif re.match(r'^[A-Z]{2}[0-9]{1,2}', text):
                 score += 20 # Good start
            
            # Character Mix
            has_alpha = any(c.isalpha() for c in text)
            has_digit = any(c.isdigit() for c in text)
            if has_alpha and has_digit: score += 10
            elif has_alpha and not has_digit: score -= 20 # Pure text (billboard?)
            
            # Ban list
            bad_words = ["TOYOTA", "HONDA", "SUZUKI", "MARUTI", "TATA", "MAHINDRA", "HYUNDAI", "FORD", "NISSAN", "RENAULT", "SKODA", "VOLKSWAGEN", "AUDI", "BMW", "MERCEDES", "VOLVO", "CHEVROLET", "JEEP", "KIA", "MG", "HECTO", "POLICE", "ARMY", "GOVT"]
            if any(bw in text for bw in bad_words):
                 score -= 50
                 
            return score

        candidates = []

        # Strategy 1: OCR on YOLO Crops & Specialized Plate Detection
        for r in results:
            for b in r.boxes:
                cls_id = int(b.cls[0])
                if cls_id in vehicle_classes:
                     x1, y1, x2, y2 = map(int, b.xyxy[0].cpu().numpy())
                     
                     # 1A. Specialized Plate Detection (if authorized model exists)
                     if plate_model:
                         # Crop the car first
                         h_img, w_img = img_cv.shape[:2]
                         # Slight padding to ensure full car is captured if bounding box is tight
                         pad_x = int((x2-x1)*0.05)
                         pad_y = int((y2-y1)*0.05)
                         cx1 = max(0, x1 - pad_x)
                         cy1 = max(0, y1 - pad_y)
                         cx2 = min(w_img, x2 + pad_x)
                         cy2 = min(h_img, y2 + pad_y)
                         
                         car_crop = img_cv[cy1:cy2, cx1:cx2]
                         
                         # Run plate detection on the car crop
                         # verbose=False to reduce log spam
                         plate_results = plate_model(car_crop, verbose=False)
                         
                         for p in plate_results:
                             for box in p.boxes:
                                 px1, py1, px2, py2 = map(int, box.xyxy[0].cpu().numpy())
                                 
                                 # Ensure within bounds of car_crop
                                 h_car, w_car = car_crop.shape[:2]
                                 px1, py1 = max(0, px1), max(0, py1)
                                 px2, py2 = min(w_car, px2), min(h_car, py2)
                                 
                                 if px2 > px1 and py2 > py1:
                                     plate_img = car_crop[py1:py2, px1:px2]
                                     
                                     # Pre-process for OCR (Gray + Otsu Thresholding) as requested
                                     gray_plate = cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY)
                                     thresh_plate = cv2.threshold(gray_plate, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
                                     
                                     # Resize if too small for OCR (often helps with small crops)
                                     ph, pw = thresh_plate.shape[:2]
                                     if ph < 32:
                                         scale = 32 / ph
                                         thresh_plate = cv2.resize(thresh_plate, (int(pw*scale), int(ph*scale)), interpolation=cv2.INTER_CUBIC)
                                     
                                     # Run OCR
                                     plate_ocr = reader.readtext(thresh_plate, detail=1)
                                     
                                     for (bbox, text, prob) in plate_ocr:
                                         cleaned = ''.join(e for e in text if e.isalnum()).upper()
                                         # Boost score for specialized detection
                                         s_score = score_plate(cleaned) + 50 
                                         candidates.append({'text': cleaned, 'source': 'specialized_plate', 'prob': prob, 'score': s_score})

                     # 1B. Fallback / Augmentation: Full Car Crop OCR 
                     # (Useful if specialized model misses or if no model loaded)
                     h_img, w_img = img_cv.shape[:2]
                     pad_x = int((x2-x1)*0.1)
                     pad_y = int((y2-y1)*0.1)
                     x1 = max(0, x1 - pad_x)
                     y1 = max(0, y1 - pad_y)
                     x2 = min(w_img, x2 + pad_x)
                     y2 = min(h_img, y2 + pad_y)
                     
                     crop = img_cv[y1:y2, x1:x2]
                     processed_crop = preprocess_image(crop)
                     
                     crop_result = reader.readtext(processed_crop, detail=1)
                     for (bbox, text, prob) in crop_result:
                          cleaned = ''.join(e for e in text if e.isalnum()).upper()
                          candidates.append({'text': cleaned, 'source': 'car_crop', 'prob': prob, 'score': score_plate(cleaned)})

        # Strategy 2: Full Image Scan (Fallback if YOLO missed or crop was bad)
        # Only run if we don't have a high scoring candidate yet? 
        # For now, let's always run or run if max score < 50
        
        curr_max_score = -100
        if candidates:
            curr_max_score = max(c['score'] for c in candidates)
            
        if curr_max_score < 50:
             print("DEBUG: Weak detection in crops, trying full image scan...")
             # Resize full image for speed/consistency (1080p height)
             target_h = 1080
             scale = 1.0
             if img_cv.shape[0] < target_h:
                  scale = target_h / img_cv.shape[0]
                  display_h = int(img_cv.shape[0] * scale)
                  display_w = int(img_cv.shape[1] * scale)
                  scan_img = cv2.resize(img_cv, (display_w, display_h))
             else:
                  scan_img = img_cv
             
             processed_full = preprocess_image(scan_img)
             full_result = reader.readtext(processed_full, detail=1)
             
             for (bbox, text, prob) in full_result:
                  cleaned = ''.join(e for e in text if e.isalnum()).upper()
                  candidates.append({'text': cleaned, 'source': 'full', 'prob': prob, 'score': score_plate(cleaned)})

        # --- Select Best Candidate ---
        license_plate = "UNKNOWN"
        best_candidate = None
        
        if candidates:
             # Sort: Primary by Score (desc), Secondary by Probability (desc)
             candidates.sort(key=lambda x: (x['score'], x['prob']), reverse=True)
             
             best = candidates[0]
             print(f"DEBUG: Best Candidate: {best['text']} (Score: {best['score']}, Prob: {best['prob']}, Source: {best['source']})")
             
             if best['score'] > 0:
                 license_plate = best['text']
                 confidence = best['prob'] # Use OCR confidence
        
        # Determine Status (Re-evaluate logic)
        status = 'verified'

        if license_plate == "UNKNOWN" or float(confidence) < 0.5:
             status = 'pending_review'
             
        # Save the image for Review Queue / History
        file_extension = "jpg" 
        image_filename = f"{uuid.uuid4()}.{file_extension}"
        image_save_path = os.path.join(UPLOAD_DIR, image_filename)
        
        # Write original contents
        with open(image_save_path, "wb") as f:
            f.write(contents)
            
        db_image_path = f"/uploads/{image_filename}"

        # --- DB Integration: Save Detection ---
        
        # Check if vehicle is authorized/known
        known_vehicle = None
        is_authorized = 0
        if license_plate != "UNKNOWN":
            known_vehicle = db.query(Vehicle).filter(Vehicle.license_plate == license_plate).first()
            if known_vehicle:
                is_authorized = 1

        # Determine Toll Amount (INR)
        # Default Rates
        rates = {'Car': 50, 'Motorcycle': 30, 'Bus': 100, 'Truck': 150}
        toll_amount = rates.get(vehicle_type, 50)


        
        print(f"DEBUG: Analyzed {license_plate} (Conf: {confidence}). Status: {status}")

        new_detection = Detection(
            vehicle_type=vehicle_type,
            license_plate=license_plate,
            confidence=f"{confidence:.2f}",
            timestamp=datetime.datetime.utcnow(),
            known_vehicle_id=known_vehicle.id if known_vehicle else None,
            is_authorized=is_authorized,
            toll_amount=toll_amount,
            status=status,
            image_path=db_image_path
        )
        db.add(new_detection)
        db.commit()

        # Build Response
        response_data = {
            "id": new_detection.id,
            "vehicleType": vehicle_type,
            "licensePlate": license_plate,
            "confidence": confidence,
            "tollAmount": toll_amount,
            "status": status,
            "color": "Detected", 
            "makeModel": f"Detected {vehicle_type}", 
            "description": f"A {vehicle_type.lower()} detected with {(confidence*100):.1f}% confidence."
        }

        if known_vehicle:
            response_data["owner"] = {
                "name": known_vehicle.owner.name,
                "info": known_vehicle.owner.contact_info,
                "photo": known_vehicle.owner.photo_path
            }
            response_data["description"] += f" OWNER MATCH: {known_vehicle.owner.name}"
            response_data["makeModel"] = known_vehicle.make_model
        
        if status == 'pending_review':
             response_data["description"] += " [FLAGGED FOR REVIEW]"

        return response_data

    except Exception as e:
        print(f"Error: {e}")
        return {
            "vehicleType": "Error",
            "licensePlate": "ERROR",
            "confidence": 0,
            "color": "Unknown",
            "makeModel": "Unknown",
            "description": str(e)
        }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

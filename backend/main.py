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

        # OCR for License Plate
        ocr_result = reader.readtext(img_cv, detail=1)
        
        candidates = []
        for (bbox, text, prob) in ocr_result:
            clean_text = ''.join(e for e in text if e.isalnum()).upper()
            if 2 <= len(clean_text) <= 10:
                # Calculate center and height
                cx = sum([p[0] for p in bbox]) / 4
                cy = sum([p[1] for p in bbox]) / 4
                min_y = min([p[1] for p in bbox])
                max_y = max([p[1] for p in bbox])
                h = max_y - min_y
                candidates.append({
                    'text': clean_text,
                    'cx': cx,
                    'cy': cy,
                    'h': h,
                    'prob': prob
                })

        license_plate = "UNKNOWN"
        if candidates:
            # Sort by Y position
            candidates.sort(key=lambda x: x['cy'])
            
            # Simple grouping logic: merge segments that are horizontally aligned and vertically close
            merged_results = []
            used_indices = set()
            
            for i in range(len(candidates)):
                if i in used_indices: continue
                
                current_group = [candidates[i]]
                used_indices.add(i)
                
                # Look for segments below this one that align horizontally
                for j in range(i + 1, len(candidates)):
                    if j in used_indices: continue
                    
                    # Heuristic: cx is close, and vertical distance is reasonable
                    if abs(candidates[j]['cx'] - candidates[i]['cx']) < 50 and \
                       abs(candidates[j]['cy'] - candidates[i]['cy']) < candidates[i]['h'] * 2.5:
                        current_group.append(candidates[j])
                        used_indices.add(j)
                
                # Combine text in the group (already sorted by cy)
                merged_text = "".join([c['text'] for c in current_group])
                merged_results.append(merged_text)
            
            # Pick the best merged result that looks like a plate
            best_plate = "UNKNOWN"
            best_score = 0
            for plate in merged_results:
                if 4 <= len(plate) <= 12:
                    score = 0
                    if any(c.isdigit() for c in plate): score += 1
                    if any(c.isalpha() for c in plate): score += 1
                    if score >= best_score:
                        best_score = score
                        best_plate = plate
            
            license_plate = best_plate

        # Save the image for Review Queue / History
        file_extension = "jpg" # Defaulting for simplicity, or could parse from filename if needed but we read content
        # Better: use UUID
        image_filename = f"{uuid.uuid4()}.{file_extension}"
        image_save_path = os.path.join(UPLOAD_DIR, image_filename)
        
        # We already read 'contents', so write it back
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

        # Determine Status
        status = 'verified'
        if confidence < 0.90: # Bumped for testing
            status = 'pending_review'
        
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

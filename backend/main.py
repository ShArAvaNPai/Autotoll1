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
        ocr_result = reader.readtext(img_cv, detail=0)
        license_plate = "UNKNOWN"
        best_plate_score = 0
        for text in ocr_result:
            clean_text = ''.join(e for e in text if e.isalnum()).upper()
            if 4 <= len(clean_text) <= 10:
                score = 0
                if any(c.isdigit() for c in clean_text): score += 1
                if any(c.isalpha() for c in clean_text): score += 1
                if score > best_plate_score:
                    best_plate_score = score
                    license_plate = clean_text

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
    uvicorn.run(app, host="0.0.0.0", port=8000)

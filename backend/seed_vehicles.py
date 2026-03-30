import os
import requests
import string
import random
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import DB setup from our codebase
from database import Base, Owner, Vehicle, init_db

DB_URL = "sqlite:///./autotoll.db"

engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

init_db()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

def generate_indian_phone():
    first_digit = random.choice(["6", "7", "8", "9"])
    rest_digits = "".join(random.choices(string.digits, k=9))
    return f"+91 {first_digit}{rest_digits[:4]} {rest_digits[4:]}"

def generate_indian_plate():
    state_codes = ["MH", "KA", "DL", "TN", "KL", "TS", "AP", "GJ", "UP", "HR"]
    state = random.choice(state_codes)
    rto = f"{random.randint(1, 99):02d}"
    letters = "".join(random.choices(string.ascii_uppercase, k=2))
    numbers = f"{random.randint(1000, 9999)}"
    return f"{state}{rto}{letters}{numbers}"

print("Fetching random users for names and photos...")
try:
    res = requests.get("https://randomuser.me/api/?results=25&nat=in")
    data = res.json()["results"]
except Exception as e:
    print("Failed to fetch from randomuser.me:", e)
    data = []

makes_models = ["Tata Nexon", "Maruti Swift", "Hyundai i20", "Mahindra Thar", "Kia Seltos", "Toyota Innova", "Honda City", "MG Hector", "Ford EcoSport", "Renault Duster"]

db = SessionLocal()

seeded_count = 0
for i in range(25):
    if i < len(data):
        user_data = data[i]
        first_name = user_data["name"]["first"]
        last_name = user_data["name"]["last"]
        name = f"{first_name} {last_name}"
        photo_url = user_data["picture"]["large"]
    else:
        name = f"Test Owner {i+1}"
        photo_url = "https://randomuser.me/api/portraits/lego/1.jpg"

    phone = generate_indian_phone()
    plate = generate_indian_plate()
    make_model = random.choice(makes_models)
    
    # Download photo
    photo_path = ""
    try:
        img_data = requests.get(photo_url).content
        filename = f"{uuid.uuid4()}.jpg"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(img_data)
        photo_path = f"/uploads/{filename}"
    except Exception as e:
        print(f"Failed to download photo for {name}: {e}")

    owner = Owner(name=name, contact_info=phone, photo_path=photo_path)
    db.add(owner)
    db.flush() # get ID

    vehicle = Vehicle(license_plate=plate, make_model=make_model, owner_id=owner.id, vehicle_type="Car")
    db.add(vehicle)

    seeded_count += 1
    print(f"Seeded: {name} - {plate} ({phone})")

db.commit()
db.close()
print(f"Successfully seeded {seeded_count} vehicles.")

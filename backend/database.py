from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./autotoll.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Owner(Base):
    __tablename__ = "owners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    contact_info = Column(String)
    photo_path = Column(String) # Path to stored image
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    vehicles = relationship("Vehicle", back_populates="owner")

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    license_plate = Column(String, unique=True, index=True)
    make_model = Column(String)
    owner_id = Column(Integer, ForeignKey("owners.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("Owner", back_populates="vehicles")

class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_type = Column(String)
    license_plate = Column(String)
    confidence = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # New Columns
    toll_amount = Column(Integer, default=0)
    status = Column(String, default="verified") # 'verified', 'pending_review'
    image_path = Column(String, nullable=True)

    # Optional: Link to a known vehicle if found
    known_vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    is_authorized = Column(Integer, default=0) # 0=Unknown, 1=Authorized, -1=Unauthorized

def init_db():
    Base.metadata.create_all(bind=engine)

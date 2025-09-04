from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# SQLite database
SQLALCHEMY_DATABASE_URL = "sqlite:///../data/database.db"
os.makedirs("../data", exist_ok=True)

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class TMCItem(Base):
    __tablename__ = "tmc_items"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, index=True)
    name = Column(String, index=True)
    receipt_date = Column(String)
    amount = Column(Float)
    price = Column(Float)
    quantity = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

class WriteOff(Base):
    __tablename__ = "writeoffs"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, index=True)
    basis = Column(String)
    item_name = Column(String, index=True)
    receipt_date = Column(String)
    price = Column(Float)
    quantity = Column(Integer)
    total_amount = Column(Float)
    writeoff_date = Column(String)
    destination = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)
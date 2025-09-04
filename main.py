from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import pandas as pd
from datetime import datetime
from typing import List

# Прямой импорт из текущей папки
import os
import sys

# Добавляем текущую директорию в путь
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

# Теперь импортируем модули
from database import SessionLocal, TMCItem, WriteOff

app = FastAPI(title="TMC Management System")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def read_root():
    return {"message": "TMC Management System API"}


@app.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(TMCItem.category).distinct().all()
    return {"categories": [cat[0] for cat in categories if cat[0]]}


@app.get("/names/{category}")
def get_names(category: str, db: Session = Depends(get_db)):
    names = db.query(TMCItem.name).filter(TMCItem.category == category).distinct().all()
    return {"names": [name[0] for name in names if name[0]]}


@app.get("/tmc/all")
def get_all_tmc(db: Session = Depends(get_db)):
    items = db.query(TMCItem).order_by(TMCItem.category, TMCItem.name).all()
    return {"items": [
        {
            "id": item.id,
            "category": item.category,
            "name": item.name,
            "receipt_date": item.receipt_date,
            "amount": item.amount,
            "price": item.price,
            "quantity": item.quantity
        } for item in items
    ]}


@app.get("/writeoffs/all")
def get_all_writeoffs(db: Session = Depends(get_db)):
    writeoffs = db.query(WriteOff).order_by(WriteOff.writeoff_date.desc()).all()
    return {"writeoffs": [
        {
            "id": w.id,
            "category": w.category,
            "basis": w.basis,
            "item_name": w.item_name,
            "receipt_date": w.receipt_date,
            "price": w.price,
            "quantity": w.quantity,
            "total_amount": w.total_amount,
            "writeoff_date": w.writeoff_date,
            "destination": w.destination
        } for w in writeoffs
    ]}


@app.post("/tmc")
def add_tmc_item(
        category: str,
        name: str,
        receipt_date: str,
        amount: float,
        price: float,
        quantity: int,
        db: Session = Depends(get_db)
):
    db_item = TMCItem(
        category=category,
        name=name,
        receipt_date=receipt_date,
        amount=amount,
        price=price,
        quantity=quantity
    )
    db.add(db_item)
    db.commit()
    return {"message": "TMC item added successfully"}


@app.post("/writeoff")
def add_writeoff(
        category: str,
        basis: str,
        item_name: str,
        quantity: int,
        writeoff_date: str,
        destination: str,
        db: Session = Depends(get_db)
):
    # Get item details
    item = db.query(TMCItem).filter(
        TMCItem.category == category,
        TMCItem.name == item_name
    ).first()

    if not item:
        return {"error": "Item not found"}

    if item.quantity < quantity:
        return {"error": "Not enough quantity"}

    # Update item quantity
    item.quantity -= quantity

    # Create writeoff record
    total_amount = item.price * quantity
    db_writeoff = WriteOff(
        category=category,
        basis=basis,
        item_name=item_name,
        receipt_date=item.receipt_date,
        price=item.price,
        quantity=quantity,
        total_amount=total_amount,
        writeoff_date=writeoff_date,
        destination=destination
    )

    db.add(db_writeoff)
    db.commit()
    return {"message": "Writeoff recorded successfully"}


@app.get("/stats")
def get_stats(start_date: str, end_date: str, destination: str = None, db: Session = Depends(get_db)):
    query = db.query(WriteOff).filter(
        WriteOff.writeoff_date >= start_date,
        WriteOff.writeoff_date <= end_date
    )

    if destination:
        query = query.filter(WriteOff.destination == destination)

    writeoffs = query.all()
    total = sum(w.total_amount for w in writeoffs)

    return {
        "total_amount": total,
        "count": len(writeoffs),
        "start_date": start_date,
        "end_date": end_date,
        "destination": destination or "Все направления"
    }


@app.get("/destinations")
def get_destinations(db: Session = Depends(get_db)):
    destinations = db.query(WriteOff.destination).distinct().all()
    return {"destinations": [dest[0] for dest in destinations if dest[0]]}


@app.get("/export/excel")
def export_excel(db: Session = Depends(get_db)):
    # Get all data
    tmc_items = db.query(TMCItem).all()
    writeoffs = db.query(WriteOff).all()

    # Convert to DataFrames
    tmc_data = [{
        "Категория": item.category,
        "Наименование": item.name,
        "Дата поступления": item.receipt_date,
        "Сумма": item.amount,
        "Цена": item.price,
        "Количество": item.quantity
    } for item in tmc_items]

    writeoff_data = [{
        "Категория": w.category,
        "Основание": w.basis,
        "Наименование": w.item_name,
        "Дата прихода": w.receipt_date,
        "Цена": w.price,
        "Количество": w.quantity,
        "Сумма списания": w.total_amount,
        "Дата списания": w.writeoff_date,
        "Куда": w.destination
    } for w in writeoffs]

    # Create Excel file
    filename = f"отчет_тмц_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    with pd.ExcelWriter(filename) as writer:
        if tmc_data:
            pd.DataFrame(tmc_data).to_excel(writer, sheet_name="Справочник ТМЦ", index=False)
        if writeoff_data:
            pd.DataFrame(writeoff_data).to_excel(writer, sheet_name="Списания", index=False)

    return FileResponse(filename, filename=filename)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
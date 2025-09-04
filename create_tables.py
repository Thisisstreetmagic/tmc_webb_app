import sys
import os

# Добавляем текущую директорию в путь, чтобы импортировать backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.database import Base, engine

if __name__ == '__main__':
    Base.metadata.create_all(bind=engine)
    print("Таблицы созданы успешно!")
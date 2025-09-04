import os
import sys
import subprocess
import webbrowser
from time import sleep


def run_server():
    print("🚀 Запуск системы учета ТМЦ...")
    print("=" * 50)

    # Получаем текущую директорию
    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, "backend")
    frontend_dir = os.path.join(base_dir, "frontend")

    # Запускаем backend
    print("Запускаем backend сервер...")
    backend_cmd = [
        sys.executable, "-m", "uvicorn", "main:app",
        "--host", "0.0.0.0", "--port", "8000", "--reload"
    ]

    backend_process = subprocess.Popen(
        backend_cmd,
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    # Ждем запуска backend
    sleep(5)

    # Запускаем frontend
    print("Запускаем frontend сервер...")
    frontend_cmd = [
        sys.executable, "-m", "http.server", "3000"
    ]

    frontend_process = subprocess.Popen(
        frontend_cmd,
        cwd=frontend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    # Ждем запуска frontend
    sleep(3)

    # Открываем браузер
    print("Открываем браузер...")
    webbrowser.open("http://localhost:3000")

    print("=" * 50)
    print("✅ СЕРВЕРЫ ЗАПУЩЕНЫ!")
    print("📍 Frontend: http://localhost:3000")
    print("📍 Backend:  http://localhost:8000")
    print("⏹️  Для остановки закройте это окно")
    print("=" * 50)

    try:
        # Ждем завершения процессов
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\n🛑 Остановка серверов...")
    except Exception as e:
        print(f"Ошибка: {e}")
    finally:
        # Завершаем процессы
        backend_process.terminate()
        frontend_process.terminate()
        print("✅ Серверы остановлены")


if __name__ == "__main__":
    run_server()
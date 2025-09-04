import http.server
import socketserver
import webbrowser
import os
from threading import Timer


def start_server():
    # Переходим в папку frontend
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    PORT = 3000

    # Пробуем разные порты если 3000 занят
    for port in [3000, 3001, 3002, 8080, 8001]:
        try:
            # Создаем HTTP сервер
            Handler = http.server.SimpleHTTPRequestHandler
            httpd = socketserver.TCPServer(("", port), Handler)

            print(f"🚀 Сервер запущен на http://localhost:{port}")
            print("📁 Обслуживается папка:", os.getcwd())
            print("⏹️  Для остановки нажмите Ctrl+C")
            print("-" * 50)

            # Автоматически открываем браузер через 2 секунды
            def open_browser():
                webbrowser.open(f"http://localhost:{port}")

            Timer(2, open_browser).start()

            # Запускаем сервер
            httpd.serve_forever()
            break

        except OSError as e:
            if "Address already in use" in str(e):
                print(f"⚠️  Порт {port} занят, пробуем следующий...")
                continue
            else:
                raise e


if __name__ == "__main__":
    start_server()
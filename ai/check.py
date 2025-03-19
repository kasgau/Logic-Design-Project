import sqlite3

# Connect to the SQLite database
db_path = r"C:\Users\18521\Downloads\lamchosucvat\Backend\users.db"  # Update this path if necessary
connection = sqlite3.connect(db_path)
cursor = connection.cursor()

# Query to retrieve all users
query = "SELECT * FROM users;"

try:
    cursor.execute(query)
    users = cursor.fetchall()
    if users:
        print("Users in the database:")
        for user in users:
            print(user)
    else:
        print("No users found in the database.")
except sqlite3.Error as e:
    print(f"An error occurred: {e}")
finally:
    connection.close()

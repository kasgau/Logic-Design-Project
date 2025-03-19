import sqlite3

def check_user_exists():
    try:
        # Connect to the database
        conn = sqlite3.connect("temp.db")
        cursor = conn.cursor()

        # Query to check if 'user1' exists
        cursor.execute("SELECT * FROM users WHERE username = ?", ("user1",))
        user = cursor.fetchone()

        if user:
            print(f"User found: {user}")
        else:
            print("User 'user1' does not exist in the database.")
        
        # Optionally, display all users for debugging
        print("\nAll users in the database:")
        cursor.execute("SELECT * FROM users")
        all_users = cursor.fetchall()
        for u in all_users:
            print(u)

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        conn.close()

# Call the function to check for user1
check_user_exists()

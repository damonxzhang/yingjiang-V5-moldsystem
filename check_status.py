import pymssql

server = '212.64.29.230'
user = 'sa'
password = 'fmM3Wv6+SyiE'
database = 'moldsys'

def check_col_status():
    try:
        conn = pymssql.connect(server=server, user=user, password=password, database=database, autocommit=True)
        cursor = conn.cursor()
        
        table_name = 'Molds'
        print(f"Checking {table_name} columns properties:")
        cursor.execute(f"""
            SELECT name, is_nullable, is_identity
            FROM sys.columns 
            WHERE object_id = OBJECT_ID('{table_name}')
        """)
        cols = cursor.fetchall()
        for col in cols:
            print(f"Column: {col[0]}, Nullable: {col[1]}, Identity: {col[2]}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_col_status()

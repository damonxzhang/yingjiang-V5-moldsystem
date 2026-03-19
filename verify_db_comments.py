import pymssql

server = '212.64.29.230'
user = 'sa'
password = 'fmM3Wv6+SyiE'
database = 'moldsys'

def verify_comments():
    try:
        conn = pymssql.connect(server=server, user=user, password=password, database=database, autocommit=True)
        cursor = conn.cursor()
        
        table_name = 'Molds'
        print(f"Verifying comments for table: {table_name}")
        
        # Table comment
        cursor.execute(f"""
            SELECT CAST(value AS NVARCHAR(MAX))
            FROM sys.extended_properties 
            WHERE major_id = OBJECT_ID('{table_name}') 
            AND minor_id = 0 AND name = 'MS_Description'
        """)
        row = cursor.fetchone()
        if row:
            print(f"Table comment: {row[0]}")
        
        # Column comments
        print("\nColumn comments:")
        cursor.execute(f"""
            SELECT 
                c.name AS ColumnName,
                CAST(p.value AS NVARCHAR(MAX)) AS Description
            FROM sys.columns c
            JOIN sys.extended_properties p ON p.major_id = c.object_id AND p.minor_id = c.column_id
            WHERE c.object_id = OBJECT_ID('{table_name}')
            AND p.name = 'MS_Description'
        """)
        rows = cursor.fetchall()
        for col_name, desc in rows:
            print(f"  {col_name}: {desc}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_comments()

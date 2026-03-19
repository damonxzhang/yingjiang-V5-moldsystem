import pymssql
import re

server = '212.64.29.230'
user = 'sa'
password = 'fmM3Wv6+SyiE'
database = 'moldsys'

def reapply_constraints():
    try:
        conn = pymssql.connect(server=server, user=user, password=password, database=database, autocommit=True)
        cursor = conn.cursor()
        print(f"Connected to {database} on {server}")

        with open('DATABASE_SCHEMA_DOC.md', 'r', encoding='utf-8') as f:
            content = f.read()

        table_sections = re.findall(r'### \d+\.\d+ .*?\((.*?)\).*?\n(.*?)(?=\n###|\Z)', content, re.DOTALL)
        
        # 1. Primary Keys
        for table_name, section in table_sections:
            rows = re.findall(r'^\| (.*?) \| (.*?) \| (.*?) \| (.*?) \|$', section, re.MULTILINE)
            pk_cols = []
            for row in rows:
                col_name, col_type, col_const, col_desc = [c.strip() for c in row]
                if 'PK' in col_const:
                    pk_cols.append(f"[{col_name}]")
            
            if pk_cols:
                print(f"Adding PK to {table_name}: ({', '.join(pk_cols)})")
                try:
                    cursor.execute(f"ALTER TABLE [{table_name}] ADD PRIMARY KEY ({', '.join(pk_cols)})")
                except Exception as e:
                    print(f"  Error adding PK to {table_name}: {e}")

        # 2. Unique Constraints
        for table_name, section in table_sections:
            rows = re.findall(r'^\| (.*?) \| (.*?) \| (.*?) \| (.*?) \|$', section, re.MULTILINE)
            for row in rows:
                col_name, col_type, col_const, col_desc = [c.strip() for c in row]
                if 'UNIQUE' in col_const:
                    print(f"Adding UNIQUE to {table_name}.{col_name}")
                    try:
                        cursor.execute(f"ALTER TABLE [{table_name}] ADD UNIQUE ([{col_name}])")
                    except Exception as e:
                        print(f"  Error adding UNIQUE to {table_name}.{col_name}: {e}")

        # 3. Foreign Keys
        # We need to be careful with the order, but since all tables exist, order doesn't matter much.
        for table_name, section in table_sections:
            rows = re.findall(r'^\| (.*?) \| (.*?) \| (.*?) \| (.*?) \|$', section, re.MULTILINE)
            for row in rows:
                col_name, col_type, col_const, col_desc = [c.strip() for c in row]
                fk_match = re.search(r'FK \((.*?)\)', col_const)
                if fk_match:
                    ref_table = fk_match.group(1)
                    # We need to find the PK of the ref_table. 
                    # Usually it's the same column name or the first column in ref_table.
                    # Let's assume it's the same column name if it exists in ref_table, 
                    # or it's the first column of the ref_table from the doc.
                    ref_col = ""
                    for rt, rs in table_sections:
                        if rt == ref_table:
                            r_rows = re.findall(r'^\| (.*?) \| (.*?) \| (.*?) \| (.*?) \|$', rs, re.MULTILINE)
                            for r_row in r_rows:
                                if 'PK' in r_row[2]:
                                    ref_col = r_row[0].strip()
                                    break
                            break
                    
                    if ref_col:
                        print(f"Adding FK to {table_name}.{col_name} -> {ref_table}.{ref_col}")
                        try:
                            cursor.execute(f"ALTER TABLE [{table_name}] ADD FOREIGN KEY ([{col_name}]) REFERENCES [{ref_table}]([{ref_col}])")
                        except Exception as e:
                            print(f"  Error adding FK to {table_name}.{col_name}: {e}")

        print("\nConstraints re-applied.")
        conn.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    reapply_constraints()

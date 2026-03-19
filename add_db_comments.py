import pymssql
import re

server = '212.64.29.230'
user = 'sa'
password = 'fmM3Wv6+SyiE'
database = 'moldsys'

def add_comments():
    try:
        conn = pymssql.connect(server=server, user=user, password=password, database=database, autocommit=True)
        cursor = conn.cursor()
        print(f"Connected to {database} on {server}")

        with open('DATABASE_SCHEMA_DOC.md', 'r', encoding='utf-8') as f:
            content = f.read()

        # Regex to find tables: ### X.X TableDescription (TableName)
        # and then the content following it until the next ### or end of file
        table_sections = re.findall(r'### \d+\.\d+ (.*?) \((.*?)\).*?\n(.*?)(?=\n###|\Z)', content, re.DOTALL)
        
        for table_desc, table_name, section in table_sections:
            table_name = table_name.strip()
            table_desc = table_desc.strip()
            print(f"Processing table: {table_name} ({table_desc})")

            # 1. Add Table Comment
            cursor.execute(f"""
                IF EXISTS (SELECT 1 FROM sys.extended_properties 
                           WHERE major_id = OBJECT_ID('{table_name}') 
                           AND minor_id = 0 AND name = 'MS_Description')
                BEGIN
                    EXEC sp_updateextendedproperty 
                        @name = N'MS_Description', @value = N'{table_desc}',
                        @level0type = N'SCHEMA', @level0name = N'dbo',
                        @level1type = N'TABLE', @level1name = N'{table_name}'
                END
                ELSE
                BEGIN
                    EXEC sp_addextendedproperty 
                        @name = N'MS_Description', @value = N'{table_desc}',
                        @level0type = N'SCHEMA', @level0name = N'dbo',
                        @level1type = N'TABLE', @level1name = N'{table_name}'
                END
            """)

            # 2. Add Column Comments
            # Regex to find column rows: | column_name | type | constraints | comment |
            rows = re.findall(r'^\| (.*?) \| (.*?) \| (.*?) \| (.*?) \|$', section, re.MULTILINE)
            for row in rows:
                col_name, _, _, col_desc = [c.strip() for c in row]
                if col_name in ['字段名', ':---']: continue
                
                print(f"  Adding comment for {table_name}.{col_name}: {col_desc}")
                
                cursor.execute(f"""
                    IF EXISTS (SELECT 1 FROM sys.extended_properties 
                               WHERE major_id = OBJECT_ID('{table_name}') 
                               AND minor_id = COLUMNPROPERTY(OBJECT_ID('{table_name}'), '{col_name}', 'ColumnID') 
                               AND name = 'MS_Description')
                    BEGIN
                        EXEC sp_updateextendedproperty 
                            @name = N'MS_Description', @value = N'{col_desc}',
                            @level0type = N'SCHEMA', @level0name = N'dbo',
                            @level1type = N'TABLE', @level1name = N'{table_name}',
                            @level2type = N'COLUMN', @level2name = N'{col_name}'
                    END
                    ELSE
                    BEGIN
                        EXEC sp_addextendedproperty 
                            @name = N'MS_Description', @value = N'{col_desc}',
                            @level0type = N'SCHEMA', @level0name = N'dbo',
                            @level1type = N'TABLE', @level1name = N'{table_name}',
                            @level2type = N'COLUMN', @level2name = N'{col_name}'
                    END
                """)

        print("\nAll table and column comments added/updated successfully.")
        conn.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_comments()

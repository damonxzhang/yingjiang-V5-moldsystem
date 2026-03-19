-- SQL 脚本：为 moldsys 数据库中的所有表检查并补齐 created_at 和 updated_at 字段
-- 数据库类型: SQL Server

USE moldsys;
GO

-- 定义需要处理的表列表
DECLARE @TableName NVARCHAR(128);
DECLARE TableCursor CURSOR FOR 
SELECT name FROM sys.tables WHERE type = 'U';

OPEN TableCursor;
FETCH NEXT FROM TableCursor INTO @TableName;

WHILE @@FETCH_STATUS = 0
BEGIN
    PRINT '正在处理表: ' + @TableName;

    -- 1. 检查并添加 created_at (创建时间)
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(@TableName) AND name = 'created_at')
    BEGIN
        DECLARE @SqlCreate NVARCHAR(MAX) = 'ALTER TABLE ' + QUOTENAME(@TableName) + ' ADD created_at DATETIME DEFAULT GETDATE();';
        EXEC sp_executesql @SqlCreate;
        PRINT '  - 已添加 created_at 字段';
    END
    ELSE
    BEGIN
        PRINT '  - created_at 字段已存在';
    END

    -- 2. 检查并添加 updated_at (修改时间)
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(@TableName) AND name = 'updated_at')
    BEGIN
        DECLARE @SqlUpdate NVARCHAR(MAX) = 'ALTER TABLE ' + QUOTENAME(@TableName) + ' ADD updated_at DATETIME DEFAULT GETDATE();';
        EXEC sp_executesql @SqlUpdate;
        PRINT '  - 已添加 updated_at 字段';
    END
    ELSE
    BEGIN
        PRINT '  - updated_at 字段已存在';
    END

    FETCH NEXT FROM TableCursor INTO @TableName;
END

CLOSE TableCursor;
DEALLOCATE TableCursor;

PRINT '所有表的时间戳字段检查并补齐完成。';
GO

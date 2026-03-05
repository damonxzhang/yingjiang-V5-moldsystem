-- SmartMold 模具管理系统 - 数据库建表脚本 (SQL Server)
-- 包含：基础配置、用户权限、设备模具、维保任务、备件库存等模块

USE master;
GO

IF EXISTS (SELECT * FROM sys.databases WHERE name = 'moldsys')
BEGIN
    ALTER DATABASE moldsys SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE moldsys;
END
GO

CREATE DATABASE moldsys;
GO

USE moldsys;
GO

-- 1. 部门表 (Departments)
CREATE TABLE Departments (
    DepartmentID INT PRIMARY KEY IDENTITY(1,1),
    DepartmentName NVARCHAR(50) NOT NULL UNIQUE
);
INSERT INTO Departments (DepartmentName) VALUES (N'大材料'), (N'小材料'), (N'模具维修部'), (N'生产部');
GO

-- 2. 角色表 (Roles)
CREATE TABLE Roles (
    RoleCode NVARCHAR(20) PRIMARY KEY,
    Description NVARCHAR(100)
);
INSERT INTO Roles (RoleCode, Description) VALUES 
('SUPER_ADMIN', N'超级管理员'),
('MAINTAINER', N'维保人员'),
('OPERATOR', N'操作员'),
('MOLD_ENGINEER', N'模具工程师');
GO

-- 3. 权限点表 (Permissions)
CREATE TABLE Permissions (
    PermissionCode NVARCHAR(50) PRIMARY KEY,
    Description NVARCHAR(100)
);
INSERT INTO Permissions (PermissionCode, Description) VALUES 
('DASHBOARD_VIEW', N'查看看板'),
('MACHINE_CONFIG', N'机台配置'),
('MOLD_MANAGEMENT', N'模具管理'),
('REPORT_EXPORT', N'报表导出'),
('TASK_EXECUTE', N'任务执行'),
('SPARE_VIEW', N'备件查看'),
('SPARE_MOVE', N'备件出入库');
GO

-- 4. 角色权限关联表 (RolePermissions)
CREATE TABLE RolePermissions (
    RoleCode NVARCHAR(20) FOREIGN KEY REFERENCES Roles(RoleCode),
    PermissionCode NVARCHAR(50) FOREIGN KEY REFERENCES Permissions(PermissionCode),
    PRIMARY KEY (RoleCode, PermissionCode)
);
INSERT INTO RolePermissions (RoleCode, PermissionCode)
SELECT 'SUPER_ADMIN', PermissionCode FROM Permissions;
GO

-- 5. 用户表 (Users)
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    UserCode NVARCHAR(50) NOT NULL UNIQUE,
    UserName NVARCHAR(50) NOT NULL,
    Password NVARCHAR(100),
    CardNo NVARCHAR(50) UNIQUE,
    RoleCode NVARCHAR(20) FOREIGN KEY REFERENCES Roles(RoleCode),
    DepartmentID INT FOREIGN KEY REFERENCES Departments(DepartmentID),
    Status NVARCHAR(20) DEFAULT 'ACTIVE',
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
INSERT INTO Users (UserCode, UserName, Password, RoleCode, DepartmentID) 
VALUES ('ADM001', N'系统管理员', 'admin123', 'SUPER_ADMIN', 1);
GO

-- 6. 设备机台表 (Machines)
CREATE TABLE Machines (
    MachineID INT PRIMARY KEY IDENTITY(1,1),
    MachineCode NVARCHAR(50) NOT NULL UNIQUE,
    Status NVARCHAR(20) DEFAULT 'NORMAL',
    Location NVARCHAR(100),
    DepartmentID INT FOREIGN KEY REFERENCES Departments(DepartmentID),
    TotalSlots INT DEFAULT 4,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 7. 模具主表 (Molds)
CREATE TABLE Molds (
    MoldID INT PRIMARY KEY IDENTITY(1,1),
    MoldCode NVARCHAR(50) NOT NULL UNIQUE,
    Name NVARCHAR(100),
    FullName NVARCHAR(200),
    ShortName NVARCHAR(50),
    Thickness NVARCHAR(50),
    MoldCategory NVARCHAR(50),
    ProductType NVARCHAR(50),
    PackageType NVARCHAR(50),
    PinCode NVARCHAR(50),
    DepartmentID INT FOREIGN KEY REFERENCES Departments(DepartmentID),
    LifeLimit INT DEFAULT 0,
    CurrentShots INT DEFAULT 0,
    Status NVARCHAR(20) DEFAULT 'IDLE',
    HealthScore DECIMAL(5,2) DEFAULT 100.00,
    NextAuditDate DATE,
    Vendor NVARCHAR(100),
    CabinetCode NVARCHAR(50),
    Location NVARCHAR(100),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 8. 机台槽位关联表 (MachineSlots)
CREATE TABLE MachineSlots (
    MachineID INT FOREIGN KEY REFERENCES Machines(MachineID),
    Slot NVARCHAR(10) NOT NULL,
    MoldID INT FOREIGN KEY REFERENCES Molds(MoldID),
    Status NVARCHAR(20) DEFAULT 'NORMAL',
    ParamReady BIT DEFAULT 0,
    MoldReady BIT DEFAULT 0,
    BuyoffReady BIT DEFAULT 0,
    UpdatedAt DATETIME DEFAULT GETDATE(),
    PRIMARY KEY (MachineID, Slot)
);
GO

-- 9. 模具 BOM 组件表 (MoldComponents)
CREATE TABLE MoldComponents (
    ComponentID INT PRIMARY KEY IDENTITY(1,1),
    MoldID INT FOREIGN KEY REFERENCES Molds(MoldID),
    Name NVARCHAR(100) NOT NULL,
    SN NVARCHAR(100),
    Category NVARCHAR(50),
    IsSpare BIT DEFAULT 0,
    LifeLimit INT,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 10. 备件库存表 (SpareParts)
CREATE TABLE SpareParts (
    SpareID INT PRIMARY KEY IDENTITY(1,1),
    SpareCode NVARCHAR(50) NOT NULL UNIQUE,
    Name NVARCHAR(100) NOT NULL,
    Spec NVARCHAR(100),
    CurrentStock INT DEFAULT 0,
    MinStock INT DEFAULT 0,
    Unit NVARCHAR(20),
    DepartmentID INT FOREIGN KEY REFERENCES Departments(DepartmentID),
    Status NVARCHAR(20) DEFAULT 'NORMAL',
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 11. 模具备件绑定表 (MoldSpareBindings)
CREATE TABLE MoldSpareBindings (
    MoldID INT FOREIGN KEY REFERENCES Molds(MoldID),
    SpareID INT FOREIGN KEY REFERENCES SpareParts(SpareID),
    Quantity INT DEFAULT 1,
    PRIMARY KEY (MoldID, SpareID)
);
GO

-- 12. 维保检查项配置 (CheckItems)
CREATE TABLE CheckItems (
    ItemID INT PRIMARY KEY IDENTITY(1,1),
    Type NVARCHAR(20) NOT NULL,
    Label NVARCHAR(200) NOT NULL,
    IsRequired BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);
INSERT INTO CheckItems (Type, Label, IsRequired) VALUES 
('MAINTENANCE', N'型腔清洁', 1),
('MAINTENANCE', N'导柱润滑', 1),
('REPAIR', N'表面磨损检查', 1);
GO

-- 13. 维保/维修工单表 (WorkOrders)
CREATE TABLE WorkOrders (
    WorkOrderID INT PRIMARY KEY IDENTITY(1,1),
    WorkOrderNo NVARCHAR(50) NOT NULL UNIQUE,
    Type NVARCHAR(20) NOT NULL,
    Priority NVARCHAR(20) DEFAULT 'MEDIUM',
    Status NVARCHAR(20) DEFAULT 'PENDING',
    MachineID INT FOREIGN KEY REFERENCES Machines(MachineID),
    MoldID INT FOREIGN KEY REFERENCES Molds(MoldID),
    CreatorID INT FOREIGN KEY REFERENCES Users(UserID),
    ExecutorID INT FOREIGN KEY REFERENCES Users(UserID),
    StartTime DATETIME,
    EndTime DATETIME,
    Description NVARCHAR(MAX),
    Remark NVARCHAR(MAX),
    AuditUserID INT FOREIGN KEY REFERENCES Users(UserID),
    AuditRemark NVARCHAR(MAX),
    AuditTime DATETIME,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 14. 工单执行明细 (WorkOrderItems)
CREATE TABLE WorkOrderItems (
    WorkOrderID INT FOREIGN KEY REFERENCES WorkOrders(WorkOrderID),
    ItemID INT FOREIGN KEY REFERENCES CheckItems(ItemID),
    IsSelected BIT DEFAULT 0,
    PRIMARY KEY (WorkOrderID, ItemID)
);
GO

-- 15. 出入库记录 (StockRecords)
CREATE TABLE StockRecords (
    RecordID INT PRIMARY KEY IDENTITY(1,1),
    SpareID INT FOREIGN KEY REFERENCES SpareParts(SpareID),
    Type NVARCHAR(20) NOT NULL,
    Amount INT NOT NULL,
    Remark NVARCHAR(MAX),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 16. 模具流转/生命周期日志 (MoldHistory)
CREATE TABLE MoldHistory (
    HistoryID INT PRIMARY KEY IDENTITY(1,1),
    MoldID INT FOREIGN KEY REFERENCES Molds(MoldID),
    Type NVARCHAR(20) NOT NULL,
    Description NVARCHAR(MAX),
    OperatorID INT FOREIGN KEY REFERENCES Users(UserID),
    MachineID INT,
    Slot NVARCHAR(10),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 17. 文件/图片上传记录 (Uploads)
CREATE TABLE Uploads (
    UploadID INT PRIMARY KEY IDENTITY(1,1),
    URL NVARCHAR(MAX) NOT NULL,
    FileName NVARCHAR(255),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    SourceModule NVARCHAR(50),
    SourceID NVARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- =============================================
-- 添加表和字段备注 (Extended Properties)
-- =============================================

-- 1. Departments
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'部门表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Departments';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'部门ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Departments', @level2type=N'COLUMN', @level2name=N'DepartmentID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'部门名称', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Departments', @level2type=N'COLUMN', @level2name=N'DepartmentName';

-- 2. Roles
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'角色表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Roles';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'角色代码', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Roles', @level2type=N'COLUMN', @level2name=N'RoleCode';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'角色描述', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Roles', @level2type=N'COLUMN', @level2name=N'Description';

-- 3. Permissions
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'权限点表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Permissions';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'权限代码', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Permissions', @level2type=N'COLUMN', @level2name=N'PermissionCode';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'权限描述', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Permissions', @level2type=N'COLUMN', @level2name=N'Description';

-- 4. RolePermissions
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'角色权限关联表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RolePermissions';

-- 5. Users
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'用户表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Users';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'用户ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Users', @level2type=N'COLUMN', @level2name=N'UserID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'用户编号', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Users', @level2type=N'COLUMN', @level2name=N'UserCode';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'用户姓名', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Users', @level2type=N'COLUMN', @level2name=N'UserName';

-- 6. Machines
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'设备机台表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Machines';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'机台ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Machines', @level2type=N'COLUMN', @level2name=N'MachineID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'机台编号', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Machines', @level2type=N'COLUMN', @level2name=N'MachineCode';

-- 7. Molds
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'模具主表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'模具唯一ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'MoldID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'模具编号', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'MoldCode';

-- 8. MachineSlots
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'机台槽位关联表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MachineSlots';

-- 9. MoldComponents
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'模具BOM组件表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldComponents';

-- 10. SpareParts
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'备件库存表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'SpareParts';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'备件ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'SpareParts', @level2type=N'COLUMN', @level2name=N'SpareID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'备件编号', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'SpareParts', @level2type=N'COLUMN', @level2name=N'SpareCode';

-- 11. MoldSpareBindings
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'模具备件绑定表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldSpareBindings';

-- 12. CheckItems
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'维保检查项配置', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'CheckItems';

-- 13. WorkOrders
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'维保/维修工单表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'WorkOrders';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'工单ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'WorkOrders', @level2type=N'COLUMN', @level2name=N'WorkOrderID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'工单单号', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'WorkOrders', @level2type=N'COLUMN', @level2name=N'WorkOrderNo';

-- 14. WorkOrderItems
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'工单执行明细', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'WorkOrderItems';

-- 15. StockRecords
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'出入库记录', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'StockRecords';

-- 16. MoldHistory
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'模具流转/生命周期日志', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldHistory';

-- 17. Uploads
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'文件/图片上传记录', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Uploads';

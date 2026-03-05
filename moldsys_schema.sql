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
    MaintenanceCycle NVARCHAR(50), -- 模具保养周期 (如: 30天/50K)
    MaintenanceStartTime DATE, -- 开始保养时间
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

-- 12. 保养检查项配置 (MaintenanceItems)
CREATE TABLE MaintenanceItems (
    ItemID INT PRIMARY KEY IDENTITY(1,1),
    Label NVARCHAR(200) NOT NULL,
    IsRequired BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);
INSERT INTO MaintenanceItems (Label, IsRequired) VALUES 
(N'型腔清洁', 1),
(N'导柱润滑', 1);
GO

-- 13. 维修故障项配置 (RepairItems)
CREATE TABLE RepairItems (
    ItemID INT PRIMARY KEY IDENTITY(1,1),
    Label NVARCHAR(200) NOT NULL,
    IsRequired BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);
INSERT INTO RepairItems (Label, IsRequired) VALUES 
(N'表面磨损检查', 1);
GO

-- 14. 保养工单表 (MaintenanceOrders)
CREATE TABLE MaintenanceOrders (
    OrderID INT PRIMARY KEY IDENTITY(1,1),
    OrderNo NVARCHAR(50) NOT NULL UNIQUE,
    Priority NVARCHAR(20) DEFAULT 'MEDIUM',
    Status NVARCHAR(20) DEFAULT 'PENDING',
    TaskSource NVARCHAR(20) DEFAULT 'MANUAL', -- 任务来源 (SCHEDULED: 定时任务, MANUAL: 手工添加)
    MaintenanceResult NVARCHAR(50), -- 保养结果 (OK/NG/WAIT)
    BuyoffStatus NVARCHAR(20) DEFAULT 'NONE', -- 验收状态 (NONE/PASSED/FAILED)
    MoldID INT FOREIGN KEY REFERENCES Molds(MoldID),
    CreatorID INT FOREIGN KEY REFERENCES Users(UserID),
    ExecutorID INT FOREIGN KEY REFERENCES Users(UserID),
    StartTime DATETIME,
    EndTime DATETIME,
    Remark NVARCHAR(MAX),
    AuditUserID INT FOREIGN KEY REFERENCES Users(UserID),
    AuditTime DATETIME,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 15. 维修工单表 (RepairOrders)
CREATE TABLE RepairOrders (
    OrderID INT PRIMARY KEY IDENTITY(1,1),
    OrderNo NVARCHAR(50) NOT NULL UNIQUE,
    Priority NVARCHAR(20) DEFAULT 'HIGH',
    Status NVARCHAR(20) DEFAULT 'PENDING',
    RepairCategory NVARCHAR(50), -- 维修类别 (小修/中修/大修/紧急)
    RepairMethod NVARCHAR(50), -- 维修方式 (内部维修/外委维修/更换备件)
    RootCause NVARCHAR(MAX), -- 故障根本原因
    MachineID INT FOREIGN KEY REFERENCES Machines(MachineID),
    MoldID INT FOREIGN KEY REFERENCES Molds(MoldID),
    FaultDescription NVARCHAR(MAX),
    CreatorID INT FOREIGN KEY REFERENCES Users(UserID),
    ExecutorID INT FOREIGN KEY REFERENCES Users(UserID),
    StartTime DATETIME,
    EndTime DATETIME,
    Remark NVARCHAR(MAX),
    AuditUserID INT FOREIGN KEY REFERENCES Users(UserID),
    AuditTime DATETIME,
    BuyoffBy INT FOREIGN KEY REFERENCES Users(UserID), -- 验收人 (QA或工程师)
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 16. 保养执行明细 (MaintenanceOrderDetails)
CREATE TABLE MaintenanceOrderDetails (
    OrderID INT FOREIGN KEY REFERENCES MaintenanceOrders(OrderID),
    ItemID INT FOREIGN KEY REFERENCES MaintenanceItems(ItemID),
    IsSelected BIT DEFAULT 0,
    PRIMARY KEY (OrderID, ItemID)
);
GO

-- 17. 维修执行明细 (RepairOrderDetails)
CREATE TABLE RepairOrderDetails (
    OrderID INT FOREIGN KEY REFERENCES RepairOrders(OrderID),
    ItemID INT FOREIGN KEY REFERENCES RepairItems(ItemID),
    IsSelected BIT DEFAULT 0,
    PRIMARY KEY (OrderID, ItemID)
);
GO

-- 18. 保养备件消耗记录 (MaintenanceOrderSpares)
CREATE TABLE MaintenanceOrderSpares (
    OrderID INT FOREIGN KEY REFERENCES MaintenanceOrders(OrderID),
    SpareID INT FOREIGN KEY REFERENCES SpareParts(SpareID),
    Quantity INT DEFAULT 1,
    PRIMARY KEY (OrderID, SpareID)
);
GO

-- 19. 维修备件消耗记录 (RepairOrderSpares)
CREATE TABLE RepairOrderSpares (
    OrderID INT FOREIGN KEY REFERENCES RepairOrders(OrderID),
    SpareID INT FOREIGN KEY REFERENCES SpareParts(SpareID),
    Quantity INT DEFAULT 1,
    PRIMARY KEY (OrderID, SpareID)
);
GO

-- 20. 出入库记录 (StockRecords)
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

-- 21. 模具流转/生命周期日志 (MoldHistory)
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

-- 22. 文件/图片上传记录 (Uploads)
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

-- 1. Departments (部门表)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'部门表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Departments';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'部门ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Departments', @level2type=N'COLUMN', @level2name=N'DepartmentID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'部门名称', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Departments', @level2type=N'COLUMN', @level2name=N'DepartmentName';

-- 2. Roles (角色表)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'角色表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Roles';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'角色代码', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Roles', @level2type=N'COLUMN', @level2name=N'RoleCode';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'角色描述', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Roles', @level2type=N'COLUMN', @level2name=N'Description';

-- 3. Permissions (权限点表)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'权限点表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Permissions';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'权限代码', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Permissions', @level2type=N'COLUMN', @level2name=N'PermissionCode';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'权限描述', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Permissions', @level2type=N'COLUMN', @level2name=N'Description';

-- 4. RolePermissions (角色权限关联表)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'角色权限关联表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RolePermissions';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'角色代码', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RolePermissions', @level2type=N'COLUMN', @level2name=N'RoleCode';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'权限代码', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RolePermissions', @level2type=N'COLUMN', @level2name=N'PermissionCode';

-- 5. Users (用户表)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'用户表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Users';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'用户ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Users', @level2type=N'COLUMN', @level2name=N'UserID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'用户编号', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Users', @level2type=N'COLUMN', @level2name=N'UserCode';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'用户姓名', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Users', @level2type=N'COLUMN', @level2name=N'UserName';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'密码', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Users', @level2type=N'COLUMN', @level2name=N'Password';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'工卡号', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Users', @level2type=N'COLUMN', @level2name=N'CardNo';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'角色代码', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Users', @level2type=N'COLUMN', @level2name=N'RoleCode';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'部门ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Users', @level2type=N'COLUMN', @level2name=N'DepartmentID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'状态(ACTIVE/INACTIVE)', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Users', @level2type=N'COLUMN', @level2name=N'Status';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Users', @level2type=N'COLUMN', @level2name=N'CreatedAt';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'更新时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Users', @level2type=N'COLUMN', @level2name=N'UpdatedAt';

-- 6. Machines (设备机台表)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'设备机台表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Machines';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'机台ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Machines', @level2type=N'COLUMN', @level2name=N'MachineID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'机台编号', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Machines', @level2type=N'COLUMN', @level2name=N'MachineCode';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'机台状态', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Machines', @level2type=N'COLUMN', @level2name=N'Status';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'位置', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Machines', @level2type=N'COLUMN', @level2name=N'Location';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'部门ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Machines', @level2type=N'COLUMN', @level2name=N'DepartmentID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'总槽位数', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Machines', @level2type=N'COLUMN', @level2name=N'TotalSlots';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Machines', @level2type=N'COLUMN', @level2name=N'CreatedAt';

-- 7. Molds (模具主表)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'模具主表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'模具唯一ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'MoldID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'模具编号', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'MoldCode';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'模具名称', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'Name';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'全称', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'FullName';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'简称', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'ShortName';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'厚度', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'Thickness';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'模具分类', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'MoldCategory';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'产品类型', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'ProductType';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'封装类型', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'PackageType';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Pin Code', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'PinCode';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'部门ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'DepartmentID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'寿命限制', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'LifeLimit';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'当前冲次', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'CurrentShots';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'状态', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'Status';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'健康分', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'HealthScore';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'下次审计日期', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'NextAuditDate';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'厂商', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'Vendor';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'储柜编号', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'CabinetCode';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'位置', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'Location';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'保养周期', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'MaintenanceCycle';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'开始保养时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'MaintenanceStartTime';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'CreatedAt';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'更新时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Molds', @level2type=N'COLUMN', @level2name=N'UpdatedAt';

-- 8. MachineSlots (机台槽位关联表)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'机台槽位关联表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MachineSlots';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'机台ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MachineSlots', @level2type=N'COLUMN', @level2name=N'MachineID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'槽位号', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MachineSlots', @level2type=N'COLUMN', @level2name=N'Slot';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'模具ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MachineSlots', @level2type=N'COLUMN', @level2name=N'MoldID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'状态', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MachineSlots', @level2type=N'COLUMN', @level2name=N'Status';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'参数就绪', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MachineSlots', @level2type=N'COLUMN', @level2name=N'ParamReady';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'模具就绪', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MachineSlots', @level2type=N'COLUMN', @level2name=N'MoldReady';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'验收就绪', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MachineSlots', @level2type=N'COLUMN', @level2name=N'BuyoffReady';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'更新时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MachineSlots', @level2type=N'COLUMN', @level2name=N'UpdatedAt';

-- 9. MoldComponents (模具BOM组件表)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'模具BOM组件表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldComponents';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'组件ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldComponents', @level2type=N'COLUMN', @level2name=N'ComponentID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'模具ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldComponents', @level2type=N'COLUMN', @level2name=N'MoldID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'组件名称', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldComponents', @level2type=N'COLUMN', @level2name=N'Name';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'序列号', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldComponents', @level2type=N'COLUMN', @level2name=N'SN';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'分类', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldComponents', @level2type=N'COLUMN', @level2name=N'Category';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否备件', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldComponents', @level2type=N'COLUMN', @level2name=N'IsSpare';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'寿命限制', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldComponents', @level2type=N'COLUMN', @level2name=N'LifeLimit';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldComponents', @level2type=N'COLUMN', @level2name=N'CreatedAt';

-- 10. SpareParts (备件库存表)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'备件库存表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'SpareParts';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'备件ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'SpareParts', @level2type=N'COLUMN', @level2name=N'SpareID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'备件编号', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'SpareParts', @level2type=N'COLUMN', @level2name=N'SpareCode';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'备件名称', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'SpareParts', @level2type=N'COLUMN', @level2name=N'Name';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'规格', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'SpareParts', @level2type=N'COLUMN', @level2name=N'Spec';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'当前库存', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'SpareParts', @level2type=N'COLUMN', @level2name=N'CurrentStock';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'安全库存', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'SpareParts', @level2type=N'COLUMN', @level2name=N'MinStock';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'单位', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'SpareParts', @level2type=N'COLUMN', @level2name=N'Unit';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'部门ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'SpareParts', @level2type=N'COLUMN', @level2name=N'DepartmentID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'状态', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'SpareParts', @level2type=N'COLUMN', @level2name=N'Status';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'SpareParts', @level2type=N'COLUMN', @level2name=N'CreatedAt';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'更新时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'SpareParts', @level2type=N'COLUMN', @level2name=N'UpdatedAt';

-- 11. MoldSpareBindings (模具备件绑定表)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'模具备件绑定表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldSpareBindings';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'模具ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldSpareBindings', @level2type=N'COLUMN', @level2name=N'MoldID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'备件ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldSpareBindings', @level2type=N'COLUMN', @level2name=N'SpareID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'数量', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldSpareBindings', @level2type=N'COLUMN', @level2name=N'Quantity';

-- 12. MaintenanceItems (保养检查项配置)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'保养检查项配置', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceItems';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'检查项ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceItems', @level2type=N'COLUMN', @level2name=N'ItemID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'检查项名称', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceItems', @level2type=N'COLUMN', @level2name=N'Label';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否必填', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceItems', @level2type=N'COLUMN', @level2name=N'IsRequired';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceItems', @level2type=N'COLUMN', @level2name=N'CreatedAt';

-- 13. RepairItems (维修故障项配置)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'维修故障项配置', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairItems';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'故障项ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairItems', @level2type=N'COLUMN', @level2name=N'ItemID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'故障项名称', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairItems', @level2type=N'COLUMN', @level2name=N'Label';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否必填', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairItems', @level2type=N'COLUMN', @level2name=N'IsRequired';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairItems', @level2type=N'COLUMN', @level2name=N'CreatedAt';

-- 14. MaintenanceOrders (保养工单表)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'保养工单表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrders';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'工单ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrders', @level2type=N'COLUMN', @level2name=N'OrderID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'工单单号', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrders', @level2type=N'COLUMN', @level2name=N'OrderNo';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'优先级', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrders', @level2type=N'COLUMN', @level2name=N'Priority';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'状态', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrders', @level2type=N'COLUMN', @level2name=N'Status';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'任务来源 (SCHEDULED: 定时任务, MANUAL: 手工添加)', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrders', @level2type=N'COLUMN', @level2name=N'TaskSource';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'保养结果', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrders', @level2type=N'COLUMN', @level2name=N'MaintenanceResult';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'验收状态', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrders', @level2type=N'COLUMN', @level2name=N'BuyoffStatus';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'模具ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrders', @level2type=N'COLUMN', @level2name=N'MoldID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建人ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrders', @level2type=N'COLUMN', @level2name=N'CreatorID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'执行人ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrders', @level2type=N'COLUMN', @level2name=N'ExecutorID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'开始时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrders', @level2type=N'COLUMN', @level2name=N'StartTime';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'结束时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrders', @level2type=N'COLUMN', @level2name=N'EndTime';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'备注', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrders', @level2type=N'COLUMN', @level2name=N'Remark';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'审核人ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrders', @level2type=N'COLUMN', @level2name=N'AuditUserID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'审核时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrders', @level2type=N'COLUMN', @level2name=N'AuditTime';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrders', @level2type=N'COLUMN', @level2name=N'CreatedAt';

-- 15. RepairOrders (维修工单表)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'维修工单表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrders';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'工单ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrders', @level2type=N'COLUMN', @level2name=N'OrderID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'工单单号', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrders', @level2type=N'COLUMN', @level2name=N'OrderNo';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'优先级', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrders', @level2type=N'COLUMN', @level2name=N'Priority';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'状态', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrders', @level2type=N'COLUMN', @level2name=N'Status';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'维修类别', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrders', @level2type=N'COLUMN', @level2name=N'RepairCategory';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'维修方式', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrders', @level2type=N'COLUMN', @level2name=N'RepairMethod';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'故障原因', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrders', @level2type=N'COLUMN', @level2name=N'RootCause';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'机台ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrders', @level2type=N'COLUMN', @level2name=N'MachineID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'模具ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrders', @level2type=N'COLUMN', @level2name=N'MoldID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'故障描述', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrders', @level2type=N'COLUMN', @level2name=N'FaultDescription';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建人ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrders', @level2type=N'COLUMN', @level2name=N'CreatorID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'执行人ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrders', @level2type=N'COLUMN', @level2name=N'ExecutorID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'开始时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrders', @level2type=N'COLUMN', @level2name=N'StartTime';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'结束时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrders', @level2type=N'COLUMN', @level2name=N'EndTime';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'备注', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrders', @level2type=N'COLUMN', @level2name=N'Remark';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'审核人ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrders', @level2type=N'COLUMN', @level2name=N'AuditUserID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'审核时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrders', @level2type=N'COLUMN', @level2name=N'AuditTime';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'验收人', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrders', @level2type=N'COLUMN', @level2name=N'BuyoffBy';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrders', @level2type=N'COLUMN', @level2name=N'CreatedAt';

-- 16. MaintenanceOrderDetails (保养执行明细)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'保养执行明细', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrderDetails';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'工单ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrderDetails', @level2type=N'COLUMN', @level2name=N'OrderID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'项目ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrderDetails', @level2type=N'COLUMN', @level2name=N'ItemID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否选中', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrderDetails', @level2type=N'COLUMN', @level2name=N'IsSelected';

-- 17. RepairOrderDetails (维修执行明细)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'维修执行明细', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrderDetails';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'工单ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrderDetails', @level2type=N'COLUMN', @level2name=N'OrderID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'项目ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrderDetails', @level2type=N'COLUMN', @level2name=N'ItemID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'是否选中', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrderDetails', @level2type=N'COLUMN', @level2name=N'IsSelected';

-- 18. MaintenanceOrderSpares (保养备件消耗记录)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'保养备件消耗记录', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrderSpares';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'工单ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrderSpares', @level2type=N'COLUMN', @level2name=N'OrderID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'备件ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrderSpares', @level2type=N'COLUMN', @level2name=N'SpareID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'数量', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MaintenanceOrderSpares', @level2type=N'COLUMN', @level2name=N'Quantity';

-- 19. RepairOrderSpares (维修备件消耗记录)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'维修备件消耗记录', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrderSpares';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'工单ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrderSpares', @level2type=N'COLUMN', @level2name=N'OrderID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'备件ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrderSpares', @level2type=N'COLUMN', @level2name=N'SpareID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'数量', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'RepairOrderSpares', @level2type=N'COLUMN', @level2name=N'Quantity';

-- 20. StockRecords (出入库记录)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'出入库记录', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'StockRecords';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'记录ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'StockRecords', @level2type=N'COLUMN', @level2name=N'RecordID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'备件ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'StockRecords', @level2type=N'COLUMN', @level2name=N'SpareID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'类型(IN/OUT)', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'StockRecords', @level2type=N'COLUMN', @level2name=N'Type';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'数量', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'StockRecords', @level2type=N'COLUMN', @level2name=N'Amount';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'备注', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'StockRecords', @level2type=N'COLUMN', @level2name=N'Remark';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'用户ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'StockRecords', @level2type=N'COLUMN', @level2name=N'UserID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'StockRecords', @level2type=N'COLUMN', @level2name=N'CreatedAt';

-- 21. MoldHistory (模具流转日志)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'模具流转日志', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldHistory';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'日志ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldHistory', @level2type=N'COLUMN', @level2name=N'HistoryID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'模具ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldHistory', @level2type=N'COLUMN', @level2name=N'MoldID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'动作类型', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldHistory', @level2type=N'COLUMN', @level2name=N'Type';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'详细描述', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldHistory', @level2type=N'COLUMN', @level2name=N'Description';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'操作人ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldHistory', @level2type=N'COLUMN', @level2name=N'OperatorID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'机台ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldHistory', @level2type=N'COLUMN', @level2name=N'MachineID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'槽位', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldHistory', @level2type=N'COLUMN', @level2name=N'Slot';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'记录时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'MoldHistory', @level2type=N'COLUMN', @level2name=N'CreatedAt';

-- 22. Uploads (上传记录)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'文件/图片上传记录', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Uploads';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'上传ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Uploads', @level2type=N'COLUMN', @level2name=N'UploadID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'文件URL', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Uploads', @level2type=N'COLUMN', @level2name=N'URL';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'文件名', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Uploads', @level2type=N'COLUMN', @level2name=N'FileName';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'用户ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Uploads', @level2type=N'COLUMN', @level2name=N'UserID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'来源模块', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Uploads', @level2type=N'COLUMN', @level2name=N'SourceModule';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'来源ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Uploads', @level2type=N'COLUMN', @level2name=N'SourceID';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'记录时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'Uploads', @level2type=N'COLUMN', @level2name=N'CreatedAt';

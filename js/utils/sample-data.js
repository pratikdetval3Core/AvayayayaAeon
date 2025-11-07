/**
 * Sample Data Seeder
 * Populates database with demo data for testing and demonstration
 */

import databaseService from '../services/database.js';
import authService from '../services/auth.js';
import User from '../models/User.js';
import Invoice from '../models/Invoice.js';
import Leave from '../models/Leave.js';
import KPI from '../models/KPI.js';

class SampleDataSeeder {
    constructor() {
        this.users = [];
        this.attendance = [];
        this.invoices = [];
        this.leave = [];
        this.kpis = [];
    }

    /**
     * Seed all sample data
     */
    async seedAll() {
        try {
            console.log('[Sample Data] Starting data seeding...');

            // Initialize database
            await databaseService.init();

            // Check if data already exists
            const existingUsers = await databaseService.getAll(databaseService.stores.USERS);
            if (existingUsers.length > 0) {
                console.log('[Sample Data] Data already exists. Skipping seed.');
                return {
                    success: false,
                    message: 'Sample data already exists'
                };
            }

            // Seed data in order
            await this.seedUsers();
            await this.seedAttendance();
            await this.seedInvoices();
            await this.seedLeave();
            await this.seedKPIs();

            console.log('[Sample Data] Seeding completed successfully!');

            return {
                success: true,
                message: 'Sample data seeded successfully',
                credentials: {
                    admin: {
                        email: 'admin@company.com',
                        password: 'Admin@123'
                    },
                    employee: {
                        email: 'john.doe@company.com',
                        password: 'Employee@123'
                    }
                },
                stats: {
                    users: this.users.length,
                    attendance: this.attendance.length,
                    invoices: this.invoices.length,
                    leave: this.leave.length,
                    kpis: this.kpis.length
                }
            };
        } catch (error) {
            console.error('[Sample Data] Seeding failed:', error);
            throw error;
        }
    }

    /**
     * Seed users (admin and employees)
     */
    async seedUsers() {
        console.log('[Sample Data] Seeding users...');

        const users = [
            // Admin user
            {
                id: 'user_admin_001',
                email: 'admin@company.com',
                password: await authService.hashPassword('Admin@123'),
                firstName: 'Admin',
                lastName: 'User',
                userType: 'admin',
                department: 'Management',
                position: 'System Administrator',
                phoneNumber: '+1234567890',
                dateOfJoining: '2020-01-01',
                isActive: true,
                profileImage: null,
                createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000 // 1 year ago
            },
            // Employee 1 - John Doe
            {
                id: 'user_emp_001',
                email: 'john.doe@company.com',
                password: await authService.hashPassword('Employee@123'),
                firstName: 'John',
                lastName: 'Doe',
                userType: 'employee',
                department: 'Engineering',
                position: 'Senior Software Engineer',
                phoneNumber: '+1234567891',
                dateOfJoining: '2021-03-15',
                isActive: true,
                profileImage: null,
                createdAt: Date.now() - 200 * 24 * 60 * 60 * 1000
            },
            // Employee 2 - Jane Smith
            {
                id: 'user_emp_002',
                email: 'jane.smith@company.com',
                password: await authService.hashPassword('Employee@123'),
                firstName: 'Jane',
                lastName: 'Smith',
                userType: 'employee',
                department: 'Marketing',
                position: 'Marketing Manager',
                phoneNumber: '+1234567892',
                dateOfJoining: '2021-06-01',
                isActive: true,
                profileImage: null,
                createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000
            },
            // Employee 3 - Mike Johnson
            {
                id: 'user_emp_003',
                email: 'mike.johnson@company.com',
                password: await authService.hashPassword('Employee@123'),
                firstName: 'Mike',
                lastName: 'Johnson',
                userType: 'employee',
                department: 'Sales',
                position: 'Sales Representative',
                phoneNumber: '+1234567893',
                dateOfJoining: '2022-01-10',
                isActive: true,
                profileImage: null,
                createdAt: Date.now() - 100 * 24 * 60 * 60 * 1000
            },
            // Employee 4 - Sarah Williams
            {
                id: 'user_emp_004',
                email: 'sarah.williams@company.com',
                password: await authService.hashPassword('Employee@123'),
                firstName: 'Sarah',
                lastName: 'Williams',
                userType: 'employee',
                department: 'HR',
                position: 'HR Specialist',
                phoneNumber: '+1234567894',
                dateOfJoining: '2022-04-01',
                isActive: true,
                profileImage: null,
                createdAt: Date.now() - 80 * 24 * 60 * 60 * 1000
            }
        ];

        for (const userData of users) {
            const user = new User(userData);
            await databaseService.add(databaseService.stores.USERS, user.toJSON());
            this.users.push(user);
        }

        console.log(`[Sample Data] Seeded ${users.length} users`);
    }

    /**
     * Seed attendance records
     */
    async seedAttendance() {
        console.log('[Sample Data] Seeding attendance...');

        const employees = this.users.filter(u => u.userType === 'employee');
        const today = new Date();

        // Generate attendance for last 30 days
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Skip weekends
            if (date.getDay() === 0 || date.getDay() === 6) continue;

            for (const employee of employees) {
                // 90% attendance rate
                if (Math.random() > 0.1) {
                    const checkInTime = new Date(date);
                    checkInTime.setHours(9, Math.floor(Math.random() * 30), 0); // 9:00-9:30 AM

                    const checkOutTime = new Date(date);
                    checkOutTime.setHours(17, Math.floor(Math.random() * 60), 0); // 5:00-6:00 PM

                    const attendance = {
                        id: `att_${employee.id}_${dateStr}`,
                        userId: employee.id,
                        date: dateStr,
                        checkInTime: checkInTime.toISOString(),
                        checkOutTime: checkOutTime.toISOString(),
                        checkInLocation: {
                            lat: 37.7749 + (Math.random() - 0.5) * 0.01,
                            lon: -122.4194 + (Math.random() - 0.5) * 0.01
                        },
                        checkOutLocation: {
                            lat: 37.7749 + (Math.random() - 0.5) * 0.01,
                            lon: -122.4194 + (Math.random() - 0.5) * 0.01
                        },
                        checkInImage: null,
                        checkOutImage: null,
                        status: 'present',
                        notes: '',
                        createdAt: checkInTime.getTime()
                    };

                    await databaseService.add(databaseService.stores.ATTENDANCE, attendance);
                    this.attendance.push(attendance);
                }
            }
        }

        console.log(`[Sample Data] Seeded ${this.attendance.length} attendance records`);
    }

    /**
     * Seed invoices
     */
    async seedInvoices() {
        console.log('[Sample Data] Seeding invoices...');

        const employees = this.users.filter(u => u.userType === 'employee');
        const statuses = ['pending', 'processed', 'rejected'];

        for (let i = 0; i < 15; i++) {
            const employee = employees[Math.floor(Math.random() * employees.length)];
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 60));

            const invoice = new Invoice({
                id: `inv_${Date.now()}_${i}`,
                userId: employee.id,
                fileName: `invoice_${i + 1}.pdf`,
                fileData: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MK', // Minimal PDF header
                fileType: 'application/pdf',
                description: [
                    'Office supplies',
                    'Travel expenses',
                    'Client meeting',
                    'Software subscription',
                    'Training materials'
                ][Math.floor(Math.random() * 5)],
                amount: Math.floor(Math.random() * 500) + 50,
                invoiceDate: date.toISOString().split('T')[0],
                location: Math.random() > 0.5 ? {
                    lat: 37.7749 + (Math.random() - 0.5) * 0.1,
                    lon: -122.4194 + (Math.random() - 0.5) * 0.1
                } : null,
                locationEnabled: Math.random() > 0.5,
                status: statuses[Math.floor(Math.random() * statuses.length)],
                uploadedAt: date.getTime()
            });

            await databaseService.add(databaseService.stores.INVOICES, invoice.toJSON());
            this.invoices.push(invoice);
        }

        console.log(`[Sample Data] Seeded ${this.invoices.length} invoices`);
    }

    /**
     * Seed leave applications
     */
    async seedLeave() {
        console.log('[Sample Data] Seeding leave applications...');

        const employees = this.users.filter(u => u.userType === 'employee');
        const leaveTypes = ['sick', 'vacation', 'personal', 'unpaid'];
        const statuses = ['pending', 'approved', 'rejected'];

        for (let i = 0; i < 12; i++) {
            const employee = employees[Math.floor(Math.random() * employees.length)];
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 60) - 30);

            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1);

            const leave = new Leave({
                id: `leave_${Date.now()}_${i}`,
                userId: employee.id,
                leaveType: leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                reason: [
                    'Medical appointment',
                    'Family vacation',
                    'Personal matters',
                    'Sick leave',
                    'Emergency'
                ][Math.floor(Math.random() * 5)],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                appliedAt: Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
                reviewedAt: Math.random() > 0.3 ? Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000 : null,
                reviewedBy: Math.random() > 0.3 ? 'user_admin_001' : null,
                reviewNotes: Math.random() > 0.5 ? 'Approved as requested' : ''
            });

            await databaseService.add(databaseService.stores.LEAVE, leave.toJSON());
            this.leave.push(leave);
        }

        console.log(`[Sample Data] Seeded ${this.leave.length} leave applications`);
    }

    /**
     * Seed KPI entries
     */
    async seedKPIs() {
        console.log('[Sample Data] Seeding KPIs...');

        const employees = this.users.filter(u => u.userType === 'employee');
        const statuses = ['pending', 'in_progress', 'completed'];

        for (let i = 0; i < 20; i++) {
            const employee = employees[Math.floor(Math.random() * employees.length)];
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));

            const kpi = new KPI({
                id: `kpi_${Date.now()}_${i}`,
                userId: employee.id,
                title: [
                    'Complete project milestone',
                    'Client presentation',
                    'Code review',
                    'Team meeting',
                    'Documentation update',
                    'Bug fixes',
                    'Feature implementation',
                    'Performance optimization'
                ][Math.floor(Math.random() * 8)],
                description: 'Sample KPI entry for demonstration purposes',
                value: `${Math.floor(Math.random() * 100)}%`,
                status: statuses[Math.floor(Math.random() * statuses.length)],
                image: null,
                location: Math.random() > 0.5 ? {
                    lat: 37.7749 + (Math.random() - 0.5) * 0.1,
                    lon: -122.4194 + (Math.random() - 0.5) * 0.1
                } : null,
                locationEnabled: Math.random() > 0.5,
                createdAt: date.getTime()
            });

            await databaseService.add(databaseService.stores.KPIS, kpi.toJSON());
            this.kpis.push(kpi);
        }

        console.log(`[Sample Data] Seeded ${this.kpis.length} KPIs`);
    }

    /**
     * Clear all data
     */
    async clearAll() {
        try {
            console.log('[Sample Data] Clearing all data...');

            await databaseService.init();

            await databaseService.clear(databaseService.stores.USERS);
            await databaseService.clear(databaseService.stores.ATTENDANCE);
            await databaseService.clear(databaseService.stores.INVOICES);
            await databaseService.clear(databaseService.stores.LEAVE);
            await databaseService.clear(databaseService.stores.KPIS);

            console.log('[Sample Data] All data cleared');

            return {
                success: true,
                message: 'All data cleared successfully'
            };
        } catch (error) {
            console.error('[Sample Data] Clear failed:', error);
            throw error;
        }
    }

    /**
     * Reset data (clear and reseed)
     */
    async reset() {
        await this.clearAll();
        return await this.seedAll();
    }
}

// Export singleton instance
const sampleDataSeeder = new SampleDataSeeder();
export default sampleDataSeeder;

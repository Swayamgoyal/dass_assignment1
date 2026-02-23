const Admin = require('../models/Admin');

/**
 * Seed admin account if it doesn't exist
 * This script should be run during initial setup
 */
const seedAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@felicity.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('✅ Admin account already exists');
            return;
        }

        // Create admin account
        const admin = new Admin({
            email: adminEmail,
            password: adminPassword
        });

        await admin.save();
        console.log('✅ Admin account created successfully');
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔑 Password: ${adminPassword}`);
        console.log('⚠️  Please change the password after first login');
    } catch (error) {
        console.error('❌ Error seeding admin:', error.message);
    }
};

module.exports = seedAdmin;

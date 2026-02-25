const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { User } = require('./models');
const sequelize = require('./config/db');

const makeAdmin = async (email) => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const user = await User.findOne({ where: { email } });
        if (!user) {
            console.log(`User with email ${email} not found.`);
            return;
        }

        user.role = 'owner';
        await user.save();
        console.log(`Successfully made ${email} an owner!`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sequelize.close();
    }
};

const email = process.argv[2];
if (!email) {
    console.log('Usage: node makeAdmin.js <email>');
} else {
    makeAdmin(email);
}

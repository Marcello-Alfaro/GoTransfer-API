import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('file_shake', 'malfarop', '!M@lfr0p_-mysql_', {
  host: '192.168.1.100',
  dialect: 'mysql',
});

export default sequelize;

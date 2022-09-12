import validator from 'validator';
import { Op } from 'sequelize';
import throwErr from '../helpers/throwErr.js';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import { FROM_EMAIL, JWT_SECRET, SENDGRID_API_KEY } from '../config/config.js';
import thread from '../utils/thread.js';
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(SENDGRID_API_KEY);

export default {
  async postSignup(req, res, next) {
    try {
      const { name, lastname, username, email, password, confirmPassword } = req.body;
      if (validator.isEmpty(name)) throwErr('Please enter your name!', 422);

      if (validator.isEmpty(lastname)) throwErr('Please enter your lastname', 422);

      if (validator.isEmpty(username)) throwErr('Please enter your username!', 422);

      const usernameExists = await User.findOne({ where: { username } });
      if (usernameExists) throwErr('This username is already taken, please choose another!', 422);

      if (validator.isEmpty(email)) throwErr('Please enter your email!', 422);

      if (!validator.isEmail(email)) throwErr('Please enter a valid email address!', 422);

      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) throwErr('Email already exists, please choose another!', 422);

      if (validator.isEmpty(password) || !validator.isLength(password, { min: 5 }))
        throwErr('Password cannot be empty and must have atleast 5 characters!', 422);
      if (validator.isEmpty(confirmPassword)) throwErr('Confirm Password cannot be empty', 422);
      if (!(password === confirmPassword)) throwErr('Passwords must match!', 422);

      const encryptedPassword = await thread('./helpers/encryptPass.js', password);

      const user = await User.create({
        name,
        lastname,
        username,
        email,
        password: encryptedPassword,
      });

      const msg = {
        to: email,
        from: FROM_EMAIL,
        subject: `Welcome to fileshake ${name} ${lastname}`,
        text: 'A useful tool to share files across the globe!',
        html: '<h3>A usefull tool to share files across the globe!</h3>',
      };

      await sgMail.send(msg);

      res.status(201).json({ message: `User created successfully, welcome! ${name} ${lastname}` });
    } catch (err) {
      next(err);
    }
  },

  async putLogIn(req, res, next) {
    try {
      const { usernameEmail, password } = req.body;
      if (validator.isEmpty(usernameEmail)) throwErr('Please enter your username or email.', 422);
      if (validator.isEmpty(password)) throwErr('Please enter your password.', 422);
      const user = await User.findOne({
        where: { [Op.or]: { username: usernameEmail, email: usernameEmail } },
      });
      if (!user) throwErr('Wrong username, email or password, please try again!', 401);
      const { id, name, lastname, username, email, password: storedPassword } = user;

      const isValidPassword = await thread('./helpers/validatePass.js', {
        password,
        storedPassword,
      });

      if (!isValidPassword) throwErr('Wrong username, email or password, please try again!', 401);

      const token = jwt.sign({ id, name, lastname, username, email }, JWT_SECRET, {
        expiresIn: '2h',
      });
      res.status(200).json({ message: 'Login successfully!', token });
    } catch (err) {
      next(err);
    }
  },

  getValidateToken(req, res, next) {
    try {
      const { authorization } = req.headers;
      if (!authorization) throwErr('No authorization header present!', 401);
      const token = authorization.split(' ')[1];
      const decodedToken = jwt.verify(token, JWT_SECRET);
      res.status(200).json({ validToken: true });
    } catch (err) {
      throw err;
    }
  },
};

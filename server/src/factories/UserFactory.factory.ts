
import { define } from 'typeorm-seeding';
import User from '../models/User';

define(User, faker => {

    const username = faker.internet.userName();
    const email = faker.internet.email(username)
    const password_hash = faker.random.alphaNumeric(40);

    return User.create({ dev: true, email, password_hash, username });
})
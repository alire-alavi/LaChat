import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) {}

    async findByName(user_name: string): Promise<User | undefined> {
        const user = await this.usersRepository.findOne({ where: { user_name } });
        return !user ? undefined : user;
    }

    async findById(id: number): Promise<User | undefined> {
        const user = await this.usersRepository.findOne({ where: { id } });
        return !user ? undefined : user;
    }

    async createUser(user_name: string): Promise<User> {
        const user = this.usersRepository.create({ user_name });
        return this.usersRepository.save(user);
    }
}

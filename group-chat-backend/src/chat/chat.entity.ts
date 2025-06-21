import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { User } from 'src/auth/user.entity';

@Entity()
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ nullable: true })
    name!: string;
    
    @OneToMany(() => Participant, (participant) => participant.conversation, {
        cascade: true,
    })
    participants!: Participant[];

    @OneToMany(() => Message, (message) => message.conversation)
    messages!: Message[];
}

@Entity()
export class Participant {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, (user) => user.participants)
    user!: User;

    @ManyToOne(() => Conversation, (conversation) => conversation.participants)
    conversation!: Conversation;

    @Column({ default: false })
    isAdmin!: boolean;
}

@Entity({ name: 'messages' })
export class Message {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Conversation, (conversation) => conversation.messages)
    conversation!: Conversation;

    @ManyToOne(() => User, { nullable: true, eager: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user?: User;

    @Column({ type: 'varchar', length: 2000 })
    message!: string;

    @CreateDateColumn({ type: 'timestamptz' })
    date!: Date;

    @ManyToOne(() => Message, { nullable: true, onDelete: 'SET NULL', eager: false })
    @JoinColumn({ name: 'reply_to' })
    reply_to?: Message;
}

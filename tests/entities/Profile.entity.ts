import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { columnLengths, tableNames } from './constants';
import { User } from './User.entity';

const dateColumnType = 'date';

@Entity({ name: tableNames.profile })
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ length: columnLengths.bio })
  public bio!: string;

  @Column({ type: dateColumnType })
  public birthDate!: Date;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn()
  public user!: User;
}

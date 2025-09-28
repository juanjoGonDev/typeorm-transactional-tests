import { describe, expect, it } from '@jest/globals';
import { userStatuses } from '../src/testing/entities/defaults';
import { Address } from '../src/testing/entities/Address.entity';
import { Profile } from '../src/testing/entities/Profile.entity';
import { User } from '../src/testing/entities/User.entity';
import { seedDatabase } from './seeds';
import { testDataSource } from './setup';

const suiteTitle = 'Transactional lifecycle';
const transientUserName = 'Transactional Spec User';
const transientUserEmail = 'transactional.spec.user@example.com';
const transientUserBio = 'Temporary profile created during a transactional test.';
const transientCity = 'Testville';
const transientCountry = 'Testland';
const transientStreet = '123 Integration Way';
const transientPostalCode = '00001';
const transientBirthDate = new Date('1990-01-01');

describe(suiteTitle, () => {
  it('persists entities inside the active transaction', async () => {
    const seedSummary = await seedDatabase(testDataSource.manager);
    const result = await testDataSource.manager.transaction(async (manager) => {
      const repository = manager.getRepository(User);
      const entity = repository.create({
        fullName: transientUserName,
        email: transientUserEmail,
        status: userStatuses.active,
        marketingOptIn: false,
        profile: manager.create(Profile, {
          bio: transientUserBio,
          birthDate: transientBirthDate
        }),
        addresses: [
          manager.create(Address, {
            street: transientStreet,
            city: transientCity,
            country: transientCountry,
            postalCode: transientPostalCode,
            isPrimary: true
          })
        ]
      });
      await repository.save(entity);
      const countInside = await repository.count();
      return countInside;
    });

    const repository = testDataSource.getRepository(User);
    const count = await repository.count();
    expect(result).toBe(seedSummary.users + 1);
    expect(count).toBe(seedSummary.users + 1);
  });

  it('restores the database state after rollback', async () => {
    const seedSummary = await seedDatabase(testDataSource.manager);
    const repository = testDataSource.getRepository(User);
    const count = await repository.count();
    expect(count).toBe(seedSummary.users);
  });
});

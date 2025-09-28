import { userStatuses } from '../../src/testing/entities/defaults';
import type { CategorySeed, ProductSeed, UserSeed } from './types';

const adaEmail = 'ada.lovelace@example.com';
const adaName = 'Ada Lovelace';
const adaBio = 'Mathematician and visionary of computing.';
const adaStreet = '10 Analytical Engine Way';
const adaCity = 'London';
const adaCountry = 'United Kingdom';
const adaPostalCode = 'SW1A1AA';
const adaBirthDate = new Date('1815-12-10');

const graceEmail = 'grace.hopper@example.com';
const graceName = 'Grace Hopper';
const graceBio = 'Computer pioneer and inventor of the compiler.';
const graceStreet = '1707 Cobol Court';
const graceCity = 'Arlington';
const graceCountry = 'United States';
const gracePostalCode = '22203';
const graceBirthDate = new Date('1906-12-09');

const hedyEmail = 'hedy.lamarr@example.com';
const hedyName = 'Hedy Lamarr';
const hedyBio = 'Inventor and actress passionate about innovation.';
const hedyStreet = '1 Frequency Hop Lane';
const hedyCity = 'Vienna';
const hedyCountry = 'Austria';
const hedyPostalCode = '1010';
const hedyBirthDate = new Date('1914-11-09');

const katherineEmail = 'katherine.johnson@example.com';
const katherineName = 'Katherine Johnson';
const katherineBio = 'NASA mathematician and orbital analyst.';
const katherineStreet = '1969 Apollo Avenue';
const katherineCity = 'White Sulphur Springs';
const katherineCountry = 'United States';
const katherinePostalCode = '24986';
const katherineBirthDate = new Date('1918-08-26');

const electronicsCategory = 'Electronics';
const booksCategory = 'Books';
const accessoriesCategory = 'Accessories';
const educationCategory = 'Education';

const keyboardSku = 'KEY-001';
const keyboardPrice = '189.99';
const keyboardInventory = 35;

const laptopStandSku = 'LAP-002';
const laptopStandPrice = '79.50';
const laptopStandInventory = 58;

const notebookSku = 'NOTE-003';
const notebookPrice = '12.00';
const notebookInventory = 150;

const algorithmBookSku = 'BOOK-004';
const algorithmBookPrice = '54.95';
const algorithmBookInventory = 42;

export const fixedCategories: ReadonlyArray<CategorySeed> = [
  { name: electronicsCategory },
  { name: booksCategory },
  { name: accessoriesCategory },
  { name: educationCategory }
];

export const fixedUsers: ReadonlyArray<UserSeed> = [
  {
    fullName: adaName,
    email: adaEmail,
    status: userStatuses.active,
    marketingOptIn: true,
    profile: { bio: adaBio, birthDate: adaBirthDate },
    addresses: [
      {
        street: adaStreet,
        city: adaCity,
        country: adaCountry,
        postalCode: adaPostalCode,
        isPrimary: true
      }
    ]
  },
  {
    fullName: graceName,
    email: graceEmail,
    status: userStatuses.active,
    marketingOptIn: true,
    profile: { bio: graceBio, birthDate: graceBirthDate },
    addresses: [
      {
        street: graceStreet,
        city: graceCity,
        country: graceCountry,
        postalCode: gracePostalCode,
        isPrimary: true
      }
    ]
  },
  {
    fullName: hedyName,
    email: hedyEmail,
    status: userStatuses.active,
    marketingOptIn: false,
    profile: { bio: hedyBio, birthDate: hedyBirthDate },
    addresses: [
      {
        street: hedyStreet,
        city: hedyCity,
        country: hedyCountry,
        postalCode: hedyPostalCode,
        isPrimary: true
      }
    ]
  },
  {
    fullName: katherineName,
    email: katherineEmail,
    status: userStatuses.active,
    marketingOptIn: true,
    profile: { bio: katherineBio, birthDate: katherineBirthDate },
    addresses: [
      {
        street: katherineStreet,
        city: katherineCity,
        country: katherineCountry,
        postalCode: katherinePostalCode,
        isPrimary: true
      }
    ]
  }
];

export const fixedProducts: ReadonlyArray<ProductSeed> = [
  {
    name: 'Mechanical Keyboard',
    sku: keyboardSku,
    price: keyboardPrice,
    inventoryCount: keyboardInventory,
    categoryName: electronicsCategory
  },
  {
    name: 'Aluminum Laptop Stand',
    sku: laptopStandSku,
    price: laptopStandPrice,
    inventoryCount: laptopStandInventory,
    categoryName: accessoriesCategory
  },
  {
    name: 'Grid Notebook',
    sku: notebookSku,
    price: notebookPrice,
    inventoryCount: notebookInventory,
    categoryName: accessoriesCategory
  },
  {
    name: 'Algorithms Anthology',
    sku: algorithmBookSku,
    price: algorithmBookPrice,
    inventoryCount: algorithmBookInventory,
    categoryName: booksCategory
  }
];


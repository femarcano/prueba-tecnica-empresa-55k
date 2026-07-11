declare global {
    interface Array<T> {
        toSorted(compareFn?: (a: T, b:T) => number): T[]
    }
}

interface APIResult {
  results: User[];
  info: Info;
}

interface Info {
  seed: string;
  results: number;
  page: number;
  version: string;
}

interface User {
  gender: Gender;
  name: Name;
  location: Location;
  email: string;
  login: Login;
  dob: Dob;
  registered: Dob;
  phone: string;
  cell: string;
  id: ID;
  picture: Picture;
  nat: string;
}

interface Dob {
  date: Date;
  age: number;
}

type Gender = "male" | "female";

interface ID {
  name: string;
  value: null | string;
}

interface Location {
  street: Street;
  city: string;
  state: string;
  country: string;
  postcode: number | string;
  coordinates: Coordinates;
  timezone: Timezone;
}

interface Coordinates {
  latitude: string;
  longitude: string;
}

interface Street {
  number: number;
  name: string;
}

interface Timezone {
  offset: string;
  description: string;
}

interface Login {
  uuid: string;
  username: string;
  password: string;
  salt: string;
  md5: string;
  sha1: string;
  sha256: string;
}

interface Name {
  title: Title;
  first: string;
  last: string;
}

type Title = "Mr" | "Mademoiselle" | "Mrs" | "Ms" | "Miss" | "Madame";

interface Picture {
  large: string;
  medium: string;
  thumbnail: string;
}

import z from "zod";

export const nameSchema = z.object({
  title: z.enum(["Mr", "Mademoiselle", "Mrs", "Ms", "Miss", "Madame"]),
  first: z.string(),
  last: z.string(),
});

export const locationSchema = z.object({
  street: z.object({
    number: z.number(),
    name: z.string(),
  }),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  postcode: z.number().or(z.string()),
  coordinates: z.object({
    latitude: z.string(),
    longitude: z.string(),
  }),
  timezone: z.object({
    offset: z.string(),
    description: z.string(),
  }),
});

export const loginSchema = z.object({
  uuid: z.uuid(),
  username: z.string(),
  password: z.string(),
  salt: z.string(),
  md5: z.string(),
  sha1: z.string(),
  sha256: z.string(),
});

export const dobSchema = z.object({
  date: z.coerce.date(),
  age: z.number(),
});

export const idSchema = z.object({
  name: z.string(),
  value: z.string().nullable(),
});

export const pictureSchema = z.object({
  large: z.string(),
  medium: z.string(),
  thumbnail: z.string(),
});

export const userSchema = z.object({
  gender: z.enum(["male", "female"]),
  name: nameSchema,
  location: locationSchema,
  email: z.email(),
  login: loginSchema,
  dob: dobSchema,
  registered: dobSchema,
  phone: z.string(),
  cell: z.string(),
  id: idSchema,
  picture: pictureSchema,
  nat: z.string(),
});

export type User = z.infer<typeof userSchema>;

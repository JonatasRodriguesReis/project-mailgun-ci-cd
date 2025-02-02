import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const greet = (name: string): string => {
  return `Hello, ${name}!`;
};

console.log(greet("World"));

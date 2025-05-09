// สร้างไฟล์ tailwind.config.js ที่ root ของโปรเจกต์

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#6BAED6",
          DEFAULT: "#3182CE",
          dark: "#1E3A8A",
        },
        accent: {
          light: "#FBD38D",
          DEFAULT: "#ED8936",
          dark: "#C05621",
        },
        neutral: {
          light: "#F7FAFC",
          DEFAULT: "#EDF2F7",
          dark: "#2D3748",
        },
      },
    },
  },
  plugins: [],
};

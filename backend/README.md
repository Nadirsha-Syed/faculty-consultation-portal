Faculty Consultation Portal - BackendThis directory contains the Node.js/Express.js server and MongoDB setup for the Faculty Consultation Booking Portal.PrerequisitesNode.js (v18+)MongoDB (local instance or MongoDB Atlas account)Local Installation and SetupInstall dependencies:npm install
Create .env file:Create a file named .env in the backend/ directory and add your environment variables:PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster-name>.mongodb.net/consultationDB?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
Run the server:To run in development mode (with nodemon):npm run dev
To run in production mode:npm start
The API will be accessible at http://localhost:5000.
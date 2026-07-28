import dotenv from 'dotenv';
dotenv.config();

export default function authenticate(req, res, next){
    const auth = req.headers.authorization;

    if (auth !== `Bearer ${process.env.QP_PARSING_SECRET}`) {
        return res.status(401).json({
           error: "Unauthorized"
        });
    }

    next();
}
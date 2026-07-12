import {fileTypeFromBuffer} from 'file-type';

export default async function validateFileType(req,res,next){
    if (!req.files || req.files.length === 0){
        return res.status(400).json({
            success:false,
            message:"Please upload a file."
        });
    }
    try{
        const type=await fileTypeFromBuffer(req.files[0].buffer);
        if(type && type.mime.startsWith("image")){
            for(let i=1;i<req.files.length;i++){
                const imgType=await fileTypeFromBuffer(req.files[i].buffer);
                if(!imgType || !imgType.mime.startsWith("image")){
                    return res.status(400).json({
                    success:false,
                    message:"Please enter valid file type or Do not manipulate the type of file."
                        });
                }
            }
        }
        else if(type && type.mime==="application/pdf"){
            if(req.files.length>1){
                return res.status(400).json({
                    success:false,
                    message:"Please enter only one pdf or multiple images. Do not insert more pdf/images with a pdf."
                        });
            }
        }
        else if(!type || type.mime!=="application/pdf"){
            return res.status(400).json({
                    success:false,
                    message:"Please enter valid file type or Do not manipulate the type of file."
                });
        }
    }
    catch(err){
        const errStatus = err.status ?? err.code ?? 500;
        return res.status(errStatus).json({
                    success:false,
                    message:"Internal Error as fileTypeFromBuffer"
            });
    }
    req.files.sort((file1,file2)=>{
        const index1=parseInt(file1.originalname.split('_')[0],10);
        const index2=parseInt(file2.originalname.split('_')[0],10);
        return index1-index2;
    });
    for(const file of req.files){
        console.log(file.originalname);
    }
    next();
}
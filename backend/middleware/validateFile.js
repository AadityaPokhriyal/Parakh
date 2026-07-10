let fileTypeModule;

async function getFileTypeFromBuffer(buffer) {
    // Lazy-load the ESM module only once
    if (!fileTypeModule) {
        fileTypeModule = await import('file-type');
    }
    
    // Execute the module's buffer function
    return await fileTypeModule.fileTypeFromBuffer(buffer);
}

async function validateFileType(req,res,next){
    if (!req.files || req.files.length === 0){
        return res.status(400).json({
            success:false,
            error:"Please upload a file."
        });
    }
    try{
        const type=await getFileTypeFromBuffer(req.files[0].buffer);
        if(type && type.mime.startsWith("image")){
            for(let i=1;i<req.files.length;i++){
                const imgType=await getFileTypeFromBuffer(req.files[i].buffer);
                if(!imgType || !imgType.mime.startsWith("image")){
                    return res.status(400).json({
                    success:false,
                    error:"Please enter valid file type or Do not manipulate the type of file."
                        });
                }
            }
        }
        else if(type && type.mime==="application/pdf"){
            if(req.files.length>1){
                return res.status(400).json({
                    success:false,
                    error:"Please enter only one pdf or multiple images. Do not insert more pdf/images with a pdf."
                        });
            }
        }
        else if(!type || type.mime!=="application/pdf"){
            return res.status(400).json({
                    success:false,
                    error:"Please enter valid file type or Do not manipulate the type of file."
                });
        }
    }
    catch(err){
        console.error("Error in validateFileType:", err);
        const errStatus = Number.isInteger(err.status) ? err.status : 500;
        return res.status(errStatus).json({
                    success:false,
                    error:"Internal Error from validateFile.js"
            });
    }
    
    next();
}

module.exports=validateFileType;
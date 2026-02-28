import { IsNotEmpty, IsMongoId, IsString } from "class-validator";
export default class UpdateShiftDto {
     @IsNotEmpty()
     @IsString()
     name:string;

     @IsNotEmpty()
     @IsMongoId()
     franchise_id:string;

     @IsNotEmpty()
     @IsString()
     start_time:string;

     @IsNotEmpty()
     @IsString()
     end_time:string;


     constructor(name:string,start_time:string,end_time:string,franchise_id:string){
         this.name=name;
         this.franchise_id=franchise_id;
         this.start_time=start_time;
         this.end_time=end_time;
     }
}

import { IsNotEmpty,IsString, IsMongoId, Matches } from "class-validator";
import { REGEX, MSG } from "../../../core";

export default class CreateShiftDto {
    @IsNotEmpty()
    @IsMongoId()
    franchise_id:string;

    @IsNotEmpty()
    @IsString()
    name:string;

    @IsNotEmpty()
    @Matches(REGEX.TIME_HH_MM, { message: MSG.TIME_HH_MM })
    start_time:string;

    @IsNotEmpty()
    @Matches(REGEX.TIME_HH_MM, { message: MSG.TIME_HH_MM })
    end_time:string;


    constructor(name:string,start_time:string,end_time:string,franchise_id:string){
        this.name=name;
        this.franchise_id=franchise_id;
        this.start_time=start_time;
        this.end_time=end_time;
    }
}

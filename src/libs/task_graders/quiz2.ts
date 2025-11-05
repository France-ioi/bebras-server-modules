import safeEval from "safe-eval";
import grade from "./quiz2_grade";
import {ScoreSettings} from "../../types";

export default {
    gradeAnswer: function(data: string, answer: string, versions: string, score_settings: ScoreSettings) {
        const grader_data = safeEval(data);

        return grade(grader_data, answer, versions, score_settings)
    }
}
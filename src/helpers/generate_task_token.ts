import jwt from 'jsonwebtoken';

interface TaskPayload {
    id: string;
    idUserAnswer: string;
    sAnswer: string;
    platformName: string;
    randomSeed: string;
    hints_requested: any[]; // Use more specific type if known
    itemUrl: string;
}

const task: TaskPayload = {
    id: 'quiz2_02',
    idUserAnswer: '',
    sAnswer: '',
    platformName: 'test',
    randomSeed: '0',
    hints_requested: [],
    itemUrl: 'http://localhost/?taskID=quiz2_02',
};

const token = jwt.sign(task, 'buddy');
console.log(token);

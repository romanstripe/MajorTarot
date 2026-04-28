import * as fs from 'fs';

// 1. 파일 읽기
const filePath = 'description_r3n5.json';
const fileContent = fs.readFileSync(filePath, 'utf-8');

// 2. JSON 파싱 (유니코드가 자동으로 한글 객체로 변환됨)
const data = JSON.parse(fileContent);

// 3. 다시 저장하기
// JSON.stringify의 3번째 인자는 들여쓰기(indent)입니다.
// 별도의 처리를 하지 않아도 기본적으로 한글로 저장되지만, 
// 인코딩을 'utf-8'로 지정해주는 것이 중요합니다.
const outputFilePath = 'description_1n5.json';
const formattedJson = JSON.stringify(data, null, 4);

fs.writeFileSync(outputFilePath, formattedJson, 'utf-8');

console.log('변환 완료! description_1n5.json 파일을 확인하세요.');
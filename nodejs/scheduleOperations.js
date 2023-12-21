import schedule from "node-schedule";
import { scrapeAllAllegroCategories } from "./scrape.mjs";

const randomScheduleMorningTime = () => {
  const hour = Math.round(Math.random() * 10 + 1); //from 1 to 10
  const min = Math.round(Math.random() * 60); //from 0 to 60
  return [hour, min];
};

const [hour, min] = randomScheduleMorningTime();
// console.log({ hour }, { min });
const scheduleOperations = () => {
  schedule.scheduleJob(`${min} ${hour} * * *`, scrapeAllAllegroCategories);
  schedule.scheduleJob(`${min} ${hour + 1} * * *`, scrapeAllAllegroCategories);
  schedule.scheduleJob(`${min} ${hour + 2} * * *`, scrapeAllAllegroCategories);
};

export default scheduleOperations;

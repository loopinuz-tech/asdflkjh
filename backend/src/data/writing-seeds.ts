export interface WritingPromptData {
  task_type: 'task_1' | 'task_2';
  title: string;
  prompt_text: string;
  image_url?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  is_premium: boolean;
  status: 'published';
}

export const TASK_1_PROMPTS: WritingPromptData[] = [
  {
    task_type: 'task_1',
    title: 'Internet Usage Growth in Four Countries (2000–2020)',
    prompt_text: 'The line graph illustrates the percentage of the population accessing the internet across four distinct nations from 2000 to 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
    image_url: '/uploads/internet-usage-2000-2020.png',
    difficulty: 'medium',
    is_premium: false,
    status: 'published'
  },
  {
    task_type: 'task_1',
    title: 'Full-Time and Part-Time Further Education by Gender in the UK',
    prompt_text: 'The chart below shows the number of men and women in further education in Britain across three periods and whether they were studying full-time or part-time. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
    image_url: '/uploads/men-women-further-education.jpg',
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_1',
    title: 'Carbon Dioxide (CO2) Emissions per Capita in Four Nations (1975–2020)',
    prompt_text: 'The line chart below illustrates the annual average carbon dioxide (CO2) emissions per person in metric tons across four countries (USA, UK, Sweden, and China) between 1975 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
    image_url: '/uploads/co2-emissions-1975-2020.jpg',
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_1',
    title: 'Electricity Generated from Renewable Sources in Six European Countries (2010 vs 2020)',
    prompt_text: 'The grouped bar chart below shows the percentage of electricity generated from renewable sources (such as wind, solar, and hydro) in six European countries in the years 2010 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
    image_url: '/uploads/renewable-energy-consumption.jpg',
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_1',
    title: 'The Stages of Water Purification and Treatment for Domestic Supply',
    prompt_text: 'The diagram below shows the sequential stages involved in the collection, purification, and treatment of water for domestic consumption. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
    image_url: '/uploads/water-purification-process.jpg',
    difficulty: 'hard',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_1',
    title: 'Gross Domestic Product (GDP) Contribution by Sector in India (1960–2000)',
    prompt_text: 'The charts below provide an overview of the percentage contribution of three primary economic sectors—Agriculture, Industry, and Services—to India\'s total Gross Domestic Product between 1960 and 2000. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
    image_url: '/uploads/india-gdp-sectors.jpg',
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_1',
    title: 'Development of Greenfield Village and Surrounding Infrastructure (1995 vs Present)',
    prompt_text: 'The two maps below show the structural changes and infrastructural developments that took place in Greenfield village between 1995 and the present day. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
    image_url: '/uploads/map-k5002.png',
    difficulty: 'hard',
    is_premium: true,
    status: 'published'
  }
];

export const TASK_2_PROMPTS: WritingPromptData[] = [
  {
    task_type: 'task_2',
    title: 'Digital Technology in Education',
    prompt_text: 'Some educators argue that digital tablets and online resources should completely replace traditional printed textbooks in schools. Others believe that paper books remain essential for effective learning. Discuss both views and give your own opinion. Write at least 250 words.',
    image_url: null,
    difficulty: 'medium',
    is_premium: false,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Urbanization and Rural Depopulation',
    prompt_text: 'In many countries, young people are leaving rural communities to pursue work and life in major metropolitan cities. What problems does this cause, and what solutions can governments implement to revitalize rural areas? Write at least 250 words.',
    image_url: null,
    difficulty: 'hard',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Artificial Intelligence and Future Employment',
    prompt_text: 'Advancements in Artificial Intelligence and automation will soon make many traditional professions obsolete. Do the advantages of widespread AI automation outweigh the potential disadvantages for human society? Write at least 250 words.',
    image_url: null,
    difficulty: 'hard',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'University Tuition Fees vs Free Higher Education',
    prompt_text: 'Some people think that university education should be free for all students, paid for by the state. Others believe that students should pay their own tuition fees since higher qualifications directly benefit their future earning potential. Discuss both views and give your own opinion. Write at least 250 words.',
    image_url: null,
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Environmental Protection: Individual Action vs Government Regulation',
    prompt_text: 'Some people argue that climate change and environmental destruction can only be solved through strict government legislation and corporate penalties. Others believe individual lifestyle changes are far more critical. Discuss both views and give your opinion. Write at least 250 words.',
    image_url: null,
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Plastic Packaging and Consumer Goods',
    prompt_text: 'Plastic waste in oceans and landfills has reached alarming levels worldwide. Many environmentalists advocate for an immediate, total ban on single-use plastic packaging. To what extent do you agree or disagree? Write at least 250 words.',
    image_url: null,
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Remote Working and Telecommuting',
    prompt_text: 'An increasing number of employees now work remotely from home rather than commuting to traditional corporate offices. Discuss the advantages and disadvantages of this modern working trend for both employers and workers. Write at least 250 words.',
    image_url: null,
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Statutory Retirement Age and Aging Societies',
    prompt_text: 'Due to rising life expectancies and pension shortfalls, several governments are raising the mandatory retirement age to 70. Is this a positive or negative development for society as a whole? Write at least 250 words.',
    image_url: null,
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Taxation on Sugar and Processed Foods',
    prompt_text: 'Obesity and lifestyle-related diseases have surged globally. Some health policy makers propose introducing heavy taxes on sugary drinks and fast food to deter unhealthy consumption. To what extent do you agree or disagree with this policy? Write at least 250 words.',
    image_url: null,
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Public Healthcare vs Private Medical Care',
    prompt_text: 'Healthcare is a fundamental human right that should be financed entirely by national taxation. Private healthcare creates an unequal two-tier system favoring the wealthy. To what extent do you agree or disagree? Write at least 250 words.',
    image_url: null,
    difficulty: 'hard',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Prison Incarceration vs Community Service Rehabilitation',
    prompt_text: 'Some criminologists claim that locking non-violent offenders in prison does not deter future crime and that community service and rehabilitation programs are far more effective. Discuss both views and give your opinion. Write at least 250 words.',
    image_url: null,
    difficulty: 'hard',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Youth Crime and Parental Responsibility',
    prompt_text: 'In many countries, youth delinquency and juvenile offenses are on the rise. Some believe that parents should be held legally responsible and fined for crimes committed by their minor children. To what extent do you agree or disagree? Write at least 250 words.',
    image_url: null,
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Mass Tourism and Cultural Preservation',
    prompt_text: 'International mass tourism brings substantial economic wealth to developing countries, but it frequently erodes indigenous traditions and degrades historical landmarks. Do the economic benefits of international tourism outweigh the cultural damage? Write at least 250 words.',
    image_url: null,
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Global Uniformity and Loss of National Identity',
    prompt_text: 'Global communication, multinational retail brands, and Hollywood cinema are causing distinct national cultures to merge into a single, uniform Western culture. Is this homogenization of culture a positive or negative development? Write at least 250 words.',
    image_url: null,
    difficulty: 'hard',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Preservation of Endangered Languages',
    prompt_text: 'Every few weeks, an indigenous minority language becomes extinct. Some people believe that governments should spend public money to preserve vanishing languages, while others argue it is a natural linguistic evolution that fosters unity. Discuss both views and give your opinion. Write at least 250 words.',
    image_url: null,
    difficulty: 'hard',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Advertising Aimed at Young Children',
    prompt_text: 'Companies spend billions marketing confectionery, fast food, and toys directly to young children via television and internet video channels. What problems does commercial advertising to minors cause, and should governments enforce strict bans? Write at least 250 words.',
    image_url: null,
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Social Media Influencers and Celebrity Culture',
    prompt_text: 'Young people today are heavily influenced by internet personalities and social media celebrities rather than teachers, scientists, or family members. Why is this happening, and is this trend beneficial or harmful to youth development? Write at least 250 words.',
    image_url: null,
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Space Exploration vs Poverty Alleviation',
    prompt_text: 'Trillions of dollars are invested in space exploration, lunar bases, and missions to Mars. Critics argue that public funding should be redirected towards eradicating immediate poverty, hunger, and disease on Earth. To what extent do you agree or disagree? Write at least 250 words.',
    image_url: null,
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Public Funding for the Arts vs Basic Public Services',
    prompt_text: 'Governments should invest tax revenue exclusively in essential public infrastructure like hospitals, roads, and schools rather than subsidizing opera houses, theater, museums, and fine art galleries. To what extent do you agree or disagree? Write at least 250 words.',
    image_url: null,
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Autonomous Driverless Vehicles on Public Roads',
    prompt_text: 'Driverless self-driving cars and automated cargo trucks are being tested in several urban cities. Discuss the potential benefits and safety risks of replacing human drivers with autonomous artificial intelligence systems. Write at least 250 words.',
    image_url: null,
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Urban Traffic Congestion and Public Transit Subsidies',
    prompt_text: 'The most effective way to eliminate chronic traffic congestion and air pollution in metropolitan centers is to make all urban buses, trams, and metro systems completely free of charge. To what extent do you agree or disagree? Write at least 250 words.',
    image_url: null,
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Gender Equality in Senior Corporate Leadership',
    prompt_text: 'Despite legal equality, women remain significantly underrepresented in corporate executive boards and political offices. Should governments introduce mandatory gender quotas to achieve equal representation? Discuss both views and give your opinion. Write at least 250 words.',
    image_url: null,
    difficulty: 'hard',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Cashless Society: Digital Payments vs Physical Currency',
    prompt_text: 'In many countries, smartphone payment apps and debit cards have largely replaced paper banknotes and coins. What are the advantages and disadvantages of moving towards a completely cashless society? Write at least 250 words.',
    image_url: null,
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Work-Life Balance and the Four-Day Work Week',
    prompt_text: 'Several progressive companies and European nations have introduced a mandatory four-day working week with no reduction in pay. Do the advantages of a shorter work week outweigh the disadvantages for economic productivity? Write at least 250 words.',
    image_url: null,
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'School Curriculum: Practical Life Skills vs Academic Theory',
    prompt_text: 'Secondary schools focus too heavily on theoretical subjects such as advanced algebra and classical history while neglecting essential life skills like personal finance, cooking, and emotional resilience. To what extent do you agree or disagree? Write at least 250 words.',
    image_url: null,
    difficulty: 'easy',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Mass Media Objectivity and Fake News',
    prompt_text: 'With the exponential rise of decentralized social media algorithms, citizens find it increasingly difficult to discern objective truth from fabricated news. What problems does the proliferation of misinformation cause, and what measures can be taken to counter it? Write at least 250 words.',
    image_url: null,
    difficulty: 'hard',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Animal Testing for Medical Research vs Cosmetic Products',
    prompt_text: 'Some people argue that using laboratory animals for scientific experiments is cruel and should be entirely outlawed. Others contend that animal testing remains vital for developing life-saving pharmaceutical drugs. Discuss both views and give your opinion. Write at least 250 words.',
    image_url: null,
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'International Aid: Financial Grants vs Technical Expertise',
    prompt_text: 'Developed nations often send billions in direct monetary aid to developing economies, yet poverty persists. Many economists claim that transferring technology, education, and technical expertise is much more effective than sending cash. To what extent do you agree or disagree? Write at least 250 words.',
    image_url: null,
    difficulty: 'hard',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'CCTV Surveillance and Public Privacy Rights',
    prompt_text: 'Facial recognition cameras and pervasive CCTV surveillance now monitor public thoroughfares in major cities. Do the crime-prevention benefits of continuous public surveillance justify the reduction in citizens\' personal privacy? Write at least 250 words.',
    image_url: null,
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  },
  {
    task_type: 'task_2',
    title: 'Fast Fashion and Consumerism',
    prompt_text: 'The modern phenomenon of "fast fashion"—cheap, mass-produced clothing discarded after minimal wear—is causing severe environmental pollution. What are the causes of this consumer trend, and what steps can individuals and governments take to curb it? Write at least 250 words.',
    image_url: null,
    difficulty: 'medium',
    is_premium: true,
    status: 'published'
  }
];

export const ALL_WRITING_PROMPTS: WritingPromptData[] = [
  ...TASK_1_PROMPTS,
  ...TASK_2_PROMPTS
];

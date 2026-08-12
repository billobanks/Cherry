-- Cherry — example pregnancy week content (DRAFT only)
-- These rows exist to prove the content-governance mechanism end to end,
-- not as a claim of medical review. They're seeded at status = 'DRAFT'
-- deliberately — pregnancy_week_content_read_published only ever returns
-- status = 'PUBLISHED' rows to end users, so none of this is visible in the
-- app until a real reviewer moves it through MEDICAL_REVIEW -> APPROVED ->
-- PUBLISHED from /admin/pregnancy-content. source, source_url, and
-- medical_reviewer are left null — filling them in without an actual
-- review would misrepresent their provenance.

insert into public.pregnancy_week_content (week_number, section, content, status) values
  (
    8, 'baby_development',
    'Around this week, early development of major organs and body systems is underway. Limb buds continue forming, and the earliest heartbeat activity is often detectable around this stage — though timing varies.',
    'DRAFT'
  ),
  (
    8, 'body_changes',
    'Hormonal changes ramp up quickly around this stage. Some people notice breast tenderness, fatigue, and nausea; others notice very little yet — both are within the range of typical experience.',
    'DRAFT'
  ),
  (
    8, 'what_you_may_notice',
    'Some people notice nausea (with or without vomiting), fatigue, and heightened sense of smell around this week. It can be common to feel emotionally up and down as hormone levels shift. Not everyone experiences the same symptoms, or to the same degree.',
    'DRAFT'
  ),
  (
    8, 'questions_for_provider',
    E'What prenatal vitamin or supplement routine do you recommend for me?\nWhat symptoms should prompt me to call between now and my next visit?\nWhen will we schedule my first prenatal visit or any early screening tests?',
    'DRAFT'
  ),
  (
    20, 'baby_development',
    'By this week, many people are able to feel movement for the first time, sometimes described as flutters. Hearing continues developing, and growth is often tracked at a routine anatomy scan around this stage.',
    'DRAFT'
  ),
  (
    20, 'body_changes',
    'A visibly rounder belly is common by now. Some people notice skin changes, increased appetite, and more energy compared to earlier in pregnancy.',
    'DRAFT'
  ),
  (
    20, 'what_you_may_notice',
    'Some people notice round ligament pain (a pulling sensation on one or both sides of the lower belly), mild back discomfort, or increased appetite. Others notice very little change beyond a growing belly. Both are common.',
    'DRAFT'
  ),
  (
    20, 'questions_for_provider',
    E'Is there anything about my anatomy scan results you''d like to discuss?\nWhat does typical fetal movement feel like at this stage, and when should I start noticing a pattern?\nAre there any classes or resources you''d recommend starting to look into?',
    'DRAFT'
  ),
  (
    32, 'baby_development',
    'In the third trimester, continued growth is the main theme — many people notice movement becoming stronger, if sometimes less frequent as space becomes more limited.',
    'DRAFT'
  ),
  (
    32, 'body_changes',
    'Growing size can bring new sensations — back discomfort, shortness of breath, and trouble finding a comfortable sleep position are commonly reported around this stage.',
    'DRAFT'
  ),
  (
    32, 'what_you_may_notice',
    'Some people notice practice contractions (sometimes called Braxton Hicks), increased swelling in the feet and ankles by the end of the day, or more frequent trips to the bathroom. Reduced fetal movement, severe swelling, or severe headache are different from typical discomfort and are worth discussing with your provider promptly.',
    'DRAFT'
  ),
  (
    32, 'questions_for_provider',
    E'What signs of labor should prompt me to call you or go to the hospital?\nCan we start talking through my birth preferences?\nWhat does a typical timeline look like for my last few prenatal visits?',
    'DRAFT'
  );

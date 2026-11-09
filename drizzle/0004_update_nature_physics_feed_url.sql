UPDATE `rss_feed`
SET `url` = 'https://www.nature.com/nphys.rss'
WHERE `url` IN (
    'http://www.nature.com/nphys/current_issue/rss/',
    'http://www.nature.com/nphys/current_issue/rss',
    'https://www.nature.com/nphys/current_issue/rss/',
    'https://www.nature.com/nphys/current_issue/rss'
);

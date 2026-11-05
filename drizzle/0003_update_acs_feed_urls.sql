UPDATE `rss_feed`
SET `url` = 'https://pubs.acs.org/rss/' || substr(`url`, length('https://pubs.acs.org/action/showFeed?type=axatoc&feed=rss&jc=') + 1) || '/asap.xml'
WHERE `publisher` = 'ACS'
  AND `url` LIKE 'https://pubs.acs.org/action/showFeed?type=axatoc&feed=rss&jc=%';

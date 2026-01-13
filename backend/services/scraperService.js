import axios from "axios";
import * as cheerio from "cheerio";

export const scrapeLinkedInJobs = async (keywords, location = "India") => {
  try {
    const searchUrl = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(
      keywords
    )}&location=${encodeURIComponent(location)}&start=0`;

    const { data } = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);
    const jobs = [];

    $(".job-search-card").each((i, element) => {
      const title = $(element).find(".base-search-card__title").text().trim();
      const company = $(element)
        .find(".base-search-card__subtitle")
        .text()
        .trim();
      const location = $(element)
        .find(".job-search-card__location")
        .text()
        .trim();
      const link = $(element).find(".base-card__full-link").attr("href");
      const date = $(element).find("time").attr("datetime");
      const id = $(element).attr("data-entity-urn")?.split(":").pop();

      if (title && company) {
        jobs.push({
          jobId: id || `scraped-${i}`,
          title,
          companyName: company,
          location,
          link,
          postedAt: date,
          source: "LinkedIn",
          isExternal: true,
          category: keywords, // Use keywords as category for now
        });
      }
    });

    return jobs;
  } catch (error) {
    console.error("LinkedIn Scraping Error:", error.message);
    return [];
  }
};

export const scrapeGenericJobs = async (keywords) => {
  // Placeholder for other sources if needed
  return [];
};

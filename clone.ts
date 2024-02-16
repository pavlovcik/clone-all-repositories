import { Octokit } from "@octokit/core";
import { paginateRest } from "@octokit/plugin-paginate-rest";
import * as dotenv from "dotenv";
import * as shell from "shelljs";
import * as path from "path";

dotenv.config();

const MyOctokit = Octokit.plugin(paginateRest);
const octokit = new MyOctokit({ auth: process.env["GITHUB_TOKEN"] });

async function cloneRepositories() {
  if (!process.env["GITHUB_TOKEN"]) {
    console.error('GITHUB_TOKEN is not set.');
    process.exit(1);
  }

  try {
    // Fetch the authenticated user's details
    const { data: user } = await octokit.request('GET /user');

    // Create a directory with the username
    const dir = path.join(process.cwd(), user.login);
    shell.mkdir('-p', dir);

    const repos = await octokit.paginate('GET /user/repos', {
      type: 'owner',
      sort: 'updated',
      per_page: 100,
    });

    repos.forEach(repo => {
      console.log(`Cloning ${repo.full_name}...`);
      // Clone the repository into the user's directory
      if (shell.exec(`git clone ${repo.clone_url} ${path.join(dir, repo.name)}`).code !== 0) {
        console.error(`Error cloning ${repo.full_name}`);
      } else {
        console.log(`Cloned ${repo.full_name} successfully.`);
      }
    });
  } catch (error) {
    console.error(`Failed to fetch repositories: ${error}`);
  }
}

cloneRepositories();
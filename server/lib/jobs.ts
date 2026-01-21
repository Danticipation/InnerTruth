/**
 * Simple Background Job Coordinator
 * Ensures background tasks are tracked, logged, and don't crash the main process.
 */

export class JobCoordinator {
  private activeJobs: Set<string> = new Set();

  /**
   * Runs a task in the background.
   * @param name Unique name for the job type
   * @param id Unique ID for this specific job instance (e.g., userId or reflectionId)
   * @param task The async function to execute
   */
  public run(name: string, id: string, task: () => Promise<void>): void {
    const jobKey = `${name}:${id}`;
    
    if (this.activeJobs.has(jobKey)) {
      console.warn(`[JOBS] Job ${jobKey} is already running. Skipping.`);
      return;
    }

    this.activeJobs.add(jobKey);
    console.log(`[JOBS] Starting background job: ${jobKey}`);

    task()
      .then(() => {
        console.log(`[JOBS] Background job completed: ${jobKey}`);
      })
      .catch((error) => {
        console.error(`[JOBS] Background job failed: ${jobKey}`, error);
      })
      .finally(() => {
        this.activeJobs.delete(jobKey);
      });
  }

  public isRunning(name: string, id: string): boolean {
    return this.activeJobs.has(`${name}:${id}`);
  }
}

export const jobCoordinator = new JobCoordinator();

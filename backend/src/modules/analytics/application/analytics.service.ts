import { Injectable } from "@nestjs/common";

@Injectable()
export class AnalyticsService {
  async getOverview() {
    return {
      activeUsers: 0,
      activeCourses: 0,
      assignmentsDue: 0
    };
  }
}

import { CommonModule } from "@angular/common";
import { Component, ViewChild, Input, ElementRef, HostListener, ChangeDetectorRef, SimpleChanges, inject } from "@angular/core";
import moment from "moment";
import { BadgeModule } from "primeng/badge";
import { BBLoaderService, BbStoreService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { TransitionService } from "projects/customer-management-ui/shared/transition/transition.service";
import { firstValueFrom } from "rxjs";

interface Task {
  id: string;
  name: string;
  start: string;           // actual start
  targetStartDate?: string;  // planned Start
  targetEndDate?: string;  // planned end
  actualEndDate?: string | null;  // actual end
  progress: number;
  isGroup?: boolean;
  color: string;
  status: string;
  duration: string;
}

@Component({
  selector: "app-gantt-chart",
  standalone: true,
  imports: [CommonModule, BadgeModule],
  templateUrl: "./gantt-chart.component.html",
  styleUrls: ["./gantt-chart.component.scss"]
})
export class GanttChartComponent {
  private bbLoader = inject(BBLoaderService);
  private transitionService = inject(TransitionService);
  private bbStore = inject(BbStoreService);
  private cdr = inject(ChangeDetectorRef);

  readonly MENU_WIDTH = 280;
  readonly MENU_HEIGHT = 180;
  @ViewChild('taskBarElement') taskBarElement!: ElementRef;
  @ViewChild('modalElement') modalElement!: ElementRef;
  @HostListener("document:click", ["$event"]) onClick(event: MouseEvent) {
    const modalClicked = this.modalElement?.nativeElement?.contains(event.target);
    const taskBarClicked = this.taskBarElement?.nativeElement?.contains(event.target);
    if (!modalClicked && !taskBarClicked) {
      this.activeTaskId = null;
    }
  }
  @Input() searchTerm = "";
  activeTaskId: string | null = null;

  private readonly PIXELS_PER_DAY = 30;
  initialScrollLeft: number = 0;
  leaveTimeout: any;
  menuPosition = { left: '0px', top: '0px' };

  months: any[] = [];
  tasks: Task[] = [];

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {

  }

  transitionId: any;
  templateData: any = null;
  userId: any;
  defTimeZone: any;
  defDateFormat: any;
  phases_list: any = [];
  original_phases_list: any = [];
  private mapToBsDateFormat(format: string): string {
    // You can expand this mapping as needed
    switch (format?.toLowerCase()) {
      case 'mm/dd/yyyy':
        return 'MM/DD/YYYY';
      case 'dd/mm/yyyy':
        return 'DD/MM/YYYY';
      case 'yyyy/mm/dd':
        return 'YYYY/MM/DD';
      default:
        return 'MM/DD/YYYY'; // fallback
    }
  }
  async ngOnInit() {
    this.userId = this.bbStore.getItem("userId");
    this.defTimeZone = this.bbStore.getItem("timeZoneKey");
    this.defDateFormat = this.mapToBsDateFormat(this.bbStore.getItem("dateFormatkey"));
    this.transitionId = history.state._id;

    if (this.transitionId && this.templateData === null) {
      await this.loadTemplatMapping();
    }
    await this.listenForUpdates();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes["searchTerm"] && !changes["searchTerm"].firstChange) {
      await this.onSerchResult();
    }
  }

  async onSerchResult() {
    try {
      const term = this.searchTerm?.trim().toLowerCase();
      console.log('this.searchTerm: ', this.searchTerm);
      if (this.searchTerm === '') {
        this.phases_list = this.original_phases_list;
        this.tasks = await this.generateTasks(this.phases_list);
        this.months = await this.generateMonthsFromTasks(this.tasks)
      } else {
        this.phases_list = this.original_phases_list.filter((phase: any) =>
          Object.values(phase)
            .join(' ')
            .toLowerCase()
            .includes(term)
        );
        this.tasks = await this.generateTasks(this.phases_list);
        this.months = await this.generateMonthsFromTasks(this.tasks)
      }

    } catch (error) {
      console.log('error: ', error);

    } finally {
      await this.renderCards(false);
      this.cdr.detectChanges();
    }
  }

  async listenForUpdates() {
    this.transitionService.listen('template-updated').subscribe(data => {
      if (this.transitionId === data?._id) {
        console.log('Received update from another user:', data);
        this.templateData = { ...this.templateData, ...data };
        this.loadTemplate();
      }

    });
  }
  async loadTemplatMapping() {
    this.bbLoader.showLoader();

    try {
      const temp = await firstValueFrom(
        this.transitionService.getByIdTemplateMapping(this.transitionId)
      );
      this.templateData = temp?.data;
      await this.loadTemplate();
    } catch (error) {
      console.log('error: ', error);

    } finally {
      this.bbLoader.hideLoader();
    }
  }

  async generateMonthsFromTasks(tasks: any[]): Promise<any[]> {
    const currentDate = new Date();

    // 1️⃣ Collect dates
    const allDates: Date[] = [];
    tasks.forEach(task => {
      if (task.start) allDates.push(new Date(task.start));
      if (task.actualEndDate) allDates.push(new Date(task.actualEndDate));
      if (task.targetEndDate) allDates.push(new Date(task.targetEndDate));
      if (!task.actualEndDate && !task.targetEndDate && !task.start && task.targetStartDate) {
        allDates.push(new Date(task.targetStartDate));
      }
    });

    let minDate: Date;
    let maxDate: Date;

    if (allDates.length === 0) {
      // ✅ No tasks → generate current full year (Jan–Dec)
      minDate = new Date(currentDate.getFullYear(), 0, 1);   // Jan 1
      maxDate = new Date(currentDate.getFullYear(), 11, 31); // Dec 31
    } else {
      // 2️⃣ Find min and max from task dates
      const rawMin = new Date(Math.min(...allDates.map(d => d.getTime())));
      const rawMax = new Date(Math.max(...allDates.map(d => d.getTime())));

      // Normalize minDate → first day of its month
      minDate = new Date(rawMin.getFullYear(), rawMin.getMonth(), 1);

      // ✅ Normalize maxDate → last day of NEXT MONTH only
      const nextMonthFirstDay = new Date(rawMax.getFullYear(), rawMax.getMonth() + 1, 1);
      maxDate = new Date(
        nextMonthFirstDay.getFullYear(),
        nextMonthFirstDay.getMonth() + 1,
        0
      ); // last day of next month
    }

    // 3️⃣ Generate months between minDate and maxDate
    const months: any[] = [];
    const iterDate = new Date(minDate);

    while (iterDate <= maxDate) {
      const year = iterDate.getFullYear();
      const month = iterDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      months.push({
        name: iterDate.toLocaleString("en-US", { month: "short", year: "numeric" }),
        days: Array.from({ length: daysInMonth }, (_, i) => i + 1),
      });

      iterDate.setMonth(iterDate.getMonth() + 1);
    }

    return months;
  }



  async generateTasks(phases_list: any[]): Promise<any[]> {
    const getColor = (status: string) =>
      ['COMPLETED', 'COMPLETED ON TIME'].includes(status)
        ? '#00AB55'
        : ['COMPLETED WITH DELAY', 'OVERDUE'].includes(status)
          ? '#8C0000'
          : status === 'IN PROGRESS'
            ? '#FF6D00'
            : '#3A423E';

    const tasks: any[] = [];

    phases_list.forEach((phase: any, idx: number) => {
      const phaseIndex = idx + 1;
      const phaseId = `phase-${phaseIndex}`;

      // Phase row
      tasks.push({
        id: phaseId,
        name: phase.phaseName,
        start: phase[`actualStartDate_${phaseIndex}`],
        targetStartDate: phase[`targetStartDate_${phaseIndex}`],
        targetEndDate: phase[`targetEndDate_${phaseIndex}`],
        actualEndDate: phase[`actualEndDate_${phaseIndex}`],
        progress: phase[`score_status_${phaseIndex}`],
        color: getColor(phase[`status_${phaseIndex}`]),
        isGroup: phase.milestone?.length > 0,
        status: phase[`status_${phaseIndex}`],
        duration: phase[`duration_${phaseIndex}`]
      });


      // Milestones
      phase.milestone?.forEach((mile: string, mIdx: number) => {
        const mileIndex = mIdx + 1;

        tasks.push({
          id: `${phaseId}-mile-${mileIndex}`,
          name: mile,
          start: phase[`actualStartDate_M${mileIndex}`],
          targetStartDate: phase[`targetStartDate_M${mileIndex}`],
          targetEndDate: phase[`targetEndDate_M${mileIndex}`],
          actualEndDate: phase[`actualEndDate_M${mileIndex}`],
          progress: phase[`score_status_M${mileIndex}`],
          color: getColor(phase[`status_M${mileIndex}`]),
          status: phase[`status_M${mileIndex}`],
          parent: phaseId,
          duration: phase[`duration_M${mileIndex}`]
        });
      });
    });

    return tasks;
  }


  async renderCards(_isUpdated: boolean) {
    /* ===================== HELPERS ===================== */
    const isMilestoneKey = (key: string, milestoneNo: number, prefix: string) =>
      key.startsWith(prefix) && key.endsWith(`M${milestoneNo}`);

    const getMilestoneDate = (
      entries: [string, any][],
      milestoneNo: number,
      prefix: string,
      mode: 'min' | 'max'
    ): string | null => {
      const dates = entries
        .filter(([k, v]) => isMilestoneKey(k, milestoneNo, prefix) && v)
        .map(([, v]) => v);

      if (!dates.length) return null;

      return mode === 'min'
        ? dates.reduce((a, b) => (a < b ? a : b))
        : dates.reduce((a, b) => (a > b ? a : b));
    };

    const getDate = (entries: [string, any][], prefix: string, mode: 'min' | 'max'): string | null => {
      const filteredDates = entries
        .filter(([key, value]) => key.startsWith(prefix) && value)
        .map(([, value]) => value);

      if (filteredDates.length === 0) return null;

      return mode === 'min'
        ? filteredDates.reduce((min: any, curr: any) => (new Date(curr) < new Date(min) ? new Date(curr) : new Date(min)))
        : filteredDates.reduce((max: any, curr: any) => (new Date(curr) > new Date(max) ? new Date(curr) : new Date(max)));
    };

    const getDateMileStone = (
      entries: [string, any][],
      prefix: string,
      mode: 'min' | 'max'
    ): string | null => {

      const filteredDates: any = entries
        .filter(([key, value]) => key.startsWith(prefix) && value)
        .map(([, value]) => value as string);

      if (filteredDates.length === 0) return null;

      return mode === 'min'
        ? filteredDates.reduce((min: any, curr: any) => (new Date(curr) < new Date(min) ? new Date(curr) : new Date(min)))
        : filteredDates.reduce((max: any, curr: any) => (new Date(curr) > new Date(max) ? new Date(curr) : new Date(max)));
    };

    const formatDate = (dateString: string | null): string | null => {
      if (!dateString) return null;
      const date = new Date(dateString);
      date.setHours(7, 0, 0, 0);
      return moment(date).format(this.defDateFormat);
    };

    const getStatus = (
      score: number | null,
      actualEnd: string | null,
      targetEnd: string | null
    ): string => {
      if (score === 100 && actualEnd && targetEnd) {
        if (actualEnd === targetEnd) return 'COMPLETED ON TIME';
        return new Date(actualEnd) > new Date(targetEnd)
          ? 'COMPLETED WITH DELAY'
          : 'COMPLETED';
      }
      if (score !== null && score > 0) return 'IN PROGRESS';
      if (targetEnd && new Date(targetEnd) < new Date()) return 'OVERDUE';
      return 'PENDING';
    };

    const getColor = (status: string) =>
      ['COMPLETED', 'COMPLETED ON TIME'].includes(status)
        ? '#00AB55'
        : ['COMPLETED WITH DELAY', 'OVERDUE'].includes(status)
          ? '#8C0000'
          : status === 'IN PROGRESS'
            ? '#FF6D00'
            : '#3A423E';

    const getStatusClass = (status: string) =>
      ['COMPLETED', 'COMPLETED ON TIME'].includes(status)
        ? 'status-green'
        : ['COMPLETED WITH DELAY', 'OVERDUE'].includes(status)
          ? 'status-red'
          : status === 'IN PROGRESS'
            ? 'status-orange'
            : 'status-ash';

    const calculateDuration = (startDate: string | null, endDate: string | null): string | null => {
      if (!startDate || !endDate) return null;

      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 0) return null;

      const years = Math.floor(daysDiff / 365);
      const days = daysDiff % 365;

      return years > 0 ? `${years} years, ${days} days` : `${days} days`;
    };

    /* ===================== MAIN ===================== */
    this.phases_list = this.templateData?.phase_info?.map((item: any) => {
      const phaseDetail = this.templateData?.transitionDetails
        ?.find((v: any) => v.oPhaseId === item._id);

      const templateDetail = this.templateData?.template_info
        ?.find((v: any) => v._id === phaseDetail?.oTemplateId);

      const milestoneIndex = phaseDetail.iSortOrder;

      const entries: [string, any][] = Object.entries(phaseDetail?.componentValues || {});

      /* ----------- GET MILESTONE LABELS ----------- */
      const milestone: string[] = [];
      templateDetail?.components?.[0]?.rows?.forEach((row: any[]) => {
        row.forEach(col => {
          col?.components?.forEach((c: any) => {
            if (c?.key?.startsWith('subheading_milestone_')) {
              milestone.push(c.label);
            }
          });
        });
      });

      let result: any = {};
      let score = 0;
      let status = 'PENDING';
      let durationInDays: string | null = null;

      if (milestone.length === 0) {
        /* ===================== NON-MILESTONE PHASE LOGIC ===================== */
        // 1️⃣ VALID STATUS COUNT (exclude N/A)
        const validStatusCount = entries.filter(
          ([k, v]) => k.startsWith('status_') && v && v !== 'N/A'
        ).length;

        // 2️⃣ TOTAL SCORE (all score_*)
        const totalScore = entries
          .filter(([k]) => k.startsWith('score_'))
          .reduce((sum, [, v]: any) => sum + Number(v || 0), 0);

        // 3️⃣ FINAL SCORE
        score =
          validStatusCount > 0
            ? Math.round((totalScore / (validStatusCount * 10)) * 100)
            : 0;

        // 4️⃣ DATES
        const minTargetStartDate = formatDate(getDate(entries, 'targetStartDate_', 'min'));
        const maxTargetEndDate = formatDate(getDate(entries, 'targetEndDate_', 'max'));
        const minActualStartDate = formatDate(getDate(entries, 'actualStartDate_', 'min'));
        const maxActualEndDate = formatDate(getDate(entries, 'actualEndDate_', 'max'));

        // 5️⃣ DURATION
        if (minActualStartDate && maxActualEndDate) {
          durationInDays = calculateDuration(minActualStartDate, maxActualEndDate);
        }

        // 6️⃣ STATUS
        const possibleStatus = entries.some(([k]) => k.startsWith('score_'))
          ? score
          : null;

        const today = moment().format(this.defDateFormat);
        status = entries.some(
          ([k, v]: any) =>
            k.startsWith('status_') &&
            v?.toUpperCase() === 'COMPLETED WITH DELAY'
        )
          ? 'COMPLETED WITH DELAY'
          : !minActualStartDate &&
            !maxActualEndDate &&
            minTargetStartDate &&
            minTargetStartDate < today
            ? 'OVERDUE'
            : getStatus(possibleStatus, maxActualEndDate, maxTargetEndDate);

        // 7️⃣ RESULT
        result = {
          [`score_status_${milestoneIndex}`]:
            status === 'OVERDUE' ? '-' : `${score}%`,
          score_template: status === 'OVERDUE' ? '-' : `${score}%`,
          score: status === 'OVERDUE' ? 100 : score,
          status,
          color: getColor(status),
          status_color: getStatusClass(status),
          [`status_${milestoneIndex}`]: status,
          [`actualStartDate_${milestoneIndex}`]: minActualStartDate,
          [`targetStartDate_${milestoneIndex}`]: minTargetStartDate,
          [`targetEndDate_${milestoneIndex}`]: maxTargetEndDate,
          [`actualEndDate_${milestoneIndex}`]:
            ['COMPLETED', 'COMPLETED ON TIME', 'COMPLETED WITH DELAY'].includes(status)
              ? maxActualEndDate
              : null,
          [`duration_${milestoneIndex}`]:
            ['COMPLETED', 'COMPLETED ON TIME', 'COMPLETED WITH DELAY'].includes(status)
              ? durationInDays
              : null
        };
      } else {
        /* ===================== MILESTONE PHASE LOGIC ===================== */
        let milestoneResult: any = {};
        let allScores: number[] = [];
        let milestoneDates = {
          minTargetStartDate: null as string | null,
          maxTargetEndDate: null as string | null,
          minActualStartDate: null as string | null,
          maxActualEndDate: null as string | null,
        };

        // Process each milestone
        milestone.forEach((_, idx) => {
          const suffix = idx + 1;
          const milestonePrefix = `M${suffix}`;

          // 1️⃣ VALID STATUS COUNT for this milestone (exclude N/A)
          const validStatusCount = entries.filter(
            ([k, v]) =>
              (k.includes(` ${milestonePrefix} `) || k.endsWith(` ${milestonePrefix}`)) &&
              k.startsWith('status_') &&
              v &&
              v !== 'N/A'
          ).length;

          // 2️⃣ TOTAL SCORE for this milestone
          const totalScore = entries
            .filter(([k]) =>
              (k.includes(` ${milestonePrefix} `) || k.endsWith(` ${milestonePrefix}`)) &&
              k.startsWith('score_')
            )
            .reduce((sum, [, v]: any) => sum + Number(v || 0), 0);

          // 3️⃣ MILESTONE SCORE
          const milestoneScore =
            validStatusCount > 0
              ? Math.round((totalScore / (validStatusCount * 10)) * 100)
              : 0;
          allScores.push(milestoneScore);

          // 4️⃣ MILESTONE DATES
          const milestoneTargetStartDate = formatDate(
            getMilestoneDate(entries, suffix, 'targetStartDate_', 'min')
          );
          const milestoneTargetEndDate = formatDate(
            getMilestoneDate(entries, suffix, 'targetEndDate_', 'max')
          );
          const milestoneActualStartDate = formatDate(
            getMilestoneDate(entries, suffix, 'actualStartDate_', 'min')
          );
          const milestoneActualEndDate = formatDate(
            getMilestoneDate(entries, suffix, 'actualEndDate_', 'max')
          );

          // 5️⃣ MILESTONE STATUS
          const possibleMilestoneStatus = entries.some(
            ([k]) =>
              (k.includes(` ${milestonePrefix} `) || k.endsWith(` ${milestonePrefix}`)) &&
              k.startsWith('score_')
          )
            ? milestoneScore
            : null;

          const today = moment().format(this.defDateFormat);
          const milestoneStatus = entries.some(
            ([k, v]: any) =>
              (k.includes(` ${milestonePrefix} `) || k.endsWith(` ${milestonePrefix}`)) &&
              k.startsWith('status_') &&
              v?.toUpperCase() === 'COMPLETED WITH DELAY'
          )
            ? 'COMPLETED WITH DELAY'
            : !milestoneActualStartDate &&
              !milestoneActualEndDate &&
              milestoneTargetStartDate &&
              milestoneTargetStartDate < today
              ? 'OVERDUE'
              : getStatus(possibleMilestoneStatus, milestoneActualEndDate, milestoneTargetEndDate);

          // 6️⃣ MILESTONE DURATION
          const milestoneDuration = calculateDuration(
            milestoneActualStartDate,
            milestoneActualEndDate
          );

          // 7️⃣ STORE MILESTONE RESULT
          milestoneResult[`score_status_${milestonePrefix}`] =
            milestoneStatus === 'OVERDUE' ? '-' : `${milestoneScore}%`;
          // 7️⃣ STORE MILESTONE RESULT
          milestoneResult[`milestoneScore_${milestonePrefix}`] =
            milestoneStatus === 'OVERDUE' ? 0 : milestoneScore;
          milestoneResult[`actualStartDate_${milestonePrefix}`] = milestoneActualStartDate;
          milestoneResult[`targetEndDate_${milestonePrefix}`] = milestoneTargetEndDate;
          milestoneResult[`targetStartDate_${milestonePrefix}`] = milestoneTargetStartDate;
          milestoneResult[`actualEndDate_${milestonePrefix}`] =
            ['COMPLETED', 'COMPLETED ON TIME', 'COMPLETED WITH DELAY'].includes(milestoneStatus)
              ? milestoneActualEndDate
              : null;
          milestoneResult[`duration_${milestonePrefix}`] =
            milestoneDuration && ['COMPLETED', 'COMPLETED ON TIME', 'COMPLETED WITH DELAY'].includes(milestoneStatus)
              ? milestoneDuration
              : null;
          milestoneResult[`status_${milestonePrefix}`] = milestoneStatus;
          milestoneResult[`status_color_${milestonePrefix}`] = getStatusClass(milestoneStatus);

        });
        // 4️⃣ MILESTONE DATES
        const milestoneTargetStartDate = formatDate(
          getDateMileStone(entries, 'targetStartDate_', 'min')
        );
        const milestoneTargetEndDate = formatDate(
          getDateMileStone(entries, 'targetEndDate_', 'max')
        );
        const milestoneActualStartDate = formatDate(
          getDateMileStone(entries, 'actualStartDate_', 'min')
        );
        const milestoneActualEndDate = formatDate(
          getDateMileStone(entries, 'actualEndDate_', 'max')
        );
        // 8️⃣ AGGREGATE DATES FOR OVERALL PHASE
        if (milestoneTargetStartDate && (!milestoneDates.minTargetStartDate || milestoneTargetStartDate < milestoneDates.minTargetStartDate)) {
          milestoneDates.minTargetStartDate = milestoneTargetStartDate;
        }
        if (milestoneTargetEndDate && (!milestoneDates.maxTargetEndDate || milestoneTargetEndDate > milestoneDates.maxTargetEndDate)) {
          milestoneDates.maxTargetEndDate = milestoneTargetEndDate;
        }
        if (milestoneActualStartDate && (!milestoneDates.minActualStartDate || milestoneActualStartDate < milestoneDates.minActualStartDate)) {
          milestoneDates.minActualStartDate = milestoneActualStartDate;
        }
        if (milestoneActualEndDate && (!milestoneDates.maxActualEndDate || milestoneActualEndDate > milestoneDates.maxActualEndDate)) {
          milestoneDates.maxActualEndDate = milestoneActualEndDate;
        }

        // 9️⃣ OVERALL PHASE SCORE
        score = allScores.length > 0
          ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
          : 0;

        // 🔟 OVERALL PHASE STATUS
        const possibleStatus = entries.some(([k]) => k.startsWith('score_'))
          ? score
          : null;

        const today = moment().format(this.defDateFormat);
        status =
          milestoneDates.minTargetStartDate === null &&
            milestoneDates.maxTargetEndDate === null &&
            milestoneDates.minActualStartDate === null &&
            milestoneDates.maxActualEndDate === null ? "PENDING" : entries.some(
              ([k, v]: any) =>
                k.startsWith('status_') &&
                v?.toUpperCase() === 'COMPLETED WITH DELAY'
            )
            ? 'COMPLETED WITH DELAY'
            : !milestoneDates.minActualStartDate &&
              !milestoneDates.maxActualEndDate &&
              milestoneDates.minTargetStartDate &&
              milestoneDates.minTargetStartDate < today
              ? 'OVERDUE'
              : getStatus(possibleStatus, milestoneDates.maxActualEndDate, milestoneDates.maxTargetEndDate);

        // 1️⃣1️⃣ OVERALL DURATION
        if (milestoneDates.minActualStartDate && milestoneDates.maxActualEndDate) {
          durationInDays = score === 100 ? calculateDuration(
            milestoneDates.minActualStartDate,
            milestoneDates.maxActualEndDate
          ) : null;
        }

        // 1️⃣2️⃣ FINAL RESULT
        result = {
          ...milestoneResult,
          [`score_status_${milestoneIndex}`]: status === 'OVERDUE' ? '-' : `${score}%`,
          score_template: status === 'OVERDUE' ? '-' : `${score}%`,
          score: status === 'OVERDUE' ? 100 : score,
          status,
          [`status_${milestoneIndex}`]: milestoneDates.minTargetStartDate === null &&
            milestoneDates.maxTargetEndDate === null &&
            milestoneDates.minActualStartDate === null &&
            milestoneDates.maxActualEndDate === null ? "PENDING" : score !== 100 ? "IN PROGRESS" : status,
          color: getColor(status),
          status_color: getStatusClass(status),
          [`actualStartDate_${milestoneIndex}`]: milestoneDates.minActualStartDate,
          [`targetStartDate_${milestoneIndex}`]: milestoneDates.minTargetStartDate,
          [`targetEndDate_${milestoneIndex}`]: milestoneDates.maxTargetEndDate,
          [`actualEndDate_${milestoneIndex}`]:
            durationInDays ?
              ['COMPLETED', 'COMPLETED ON TIME', 'COMPLETED WITH DELAY'].includes(status)
                ? milestoneDates.maxActualEndDate
                : null : null,
          [`duration_${milestoneIndex}`]:
            durationInDays ?
              ['COMPLETED', 'COMPLETED ON TIME', 'COMPLETED WITH DELAY'].includes(status)
                ? durationInDays
                : null : null
        };
      }

      return {
        phaseName: item?.cPhaseName,
        phase_id: item?._id,
        _id: phaseDetail?.oTemplateId,
        milestone,
        ...result,
        iSortOrder: milestoneIndex
      };
    });
    this.original_phases_list = this.phases_list;

  }

  async loadTemplate() {
    try {
      await this.renderCards(false);
      this.phases_list = this.phases_list.sort((a: any, b: any) => a.iSortOrder - b.iSortOrder);
      console.log('this.phases_list: ', this.phases_list);
      this.tasks = await this.generateTasks(this.phases_list);
      console.log('this.tasks: ', this.tasks);
      this.months = await this.generateMonthsFromTasks(this.tasks)
      console.log('this.months: ', this.months);
    } catch (error) {
      console.error("loadTemplate error:", error);
    }
  }

  generateMonths(startDate: Date, count: number) {
    const months: any[] = [];
    const current = new Date(startDate);
    for (let i = 0; i < count; i++) {
      const year = current.getFullYear();
      const month = current.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      months.push({
        name: current.toLocaleString("en-US", { month: "short", year: "numeric" }),
        days: Array.from({ length: daysInMonth }, (_, i) => i + 1)
      });
      current.setMonth(month + 1);
    }
    return months;
  }

  getPlannedPosition(task: Task) {
    if (!task.start || !task.targetEndDate) return { width: "0px", left: "0px" };
    const start = new Date(task.start);
    const end = new Date(task?.actualEndDate ? task?.actualEndDate : task.targetEndDate);
    return this.calculateBarPosition(start, end);
  }

  getActualPosition(task: any) {
    if (!task.progress) return { width: "0px", left: "0px" };
    const planned = this.getPlannedPosition(task);

    const plannedWidth = parseFloat(planned.width);
    const progress = Number(task.progress.replace('%', '') || 0);

    return {
      left: planned.left,                       // start from planned start
      width: `${(plannedWidth * (progress === 0 ? 5 : progress)) / 100}px`   // % of planned width
    };
  }


  private calculateBarPosition(start: Date, end: Date) {
    const durationInDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;
    const chartStart = new Date(this.months[0].name);
    const offsetInDays = (start.getTime() - chartStart.getTime()) / (1000 * 60 * 60 * 24);
    return {
      width: `${durationInDays * this.PIXELS_PER_DAY}px`,
      left: `${offsetInDays * this.PIXELS_PER_DAY}px`
    };
  }


  addNewcontainerFn(event: MouseEvent, taskId: string) {
    // Clear any pending close timers if we re-enter
    if (this.leaveTimeout) clearTimeout(this.leaveTimeout);

    this.activeTaskId = taskId;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Logic for boundaries
    let finalLeft = event.clientX;
    if (event.clientX + this.MENU_WIDTH > screenWidth) {
      finalLeft = event.clientX - this.MENU_WIDTH;
    }

    let finalTop = event.clientY;
    if (event.clientY + this.MENU_HEIGHT > screenHeight) {
      finalTop = event.clientY - this.MENU_HEIGHT;
    }

    this.menuPosition = {
      left: `${finalLeft}px`,
      top: `${finalTop}px`
    };
  }

  closeContainer() {
    // Wait 100ms before closing to see if mouse enters the menu
    this.leaveTimeout = setTimeout(() => {
      this.activeTaskId = null;
    }, 100);
  }

  keepOpen() {
    // If mouse enters the menu itself, cancel the closing timer
    if (this.leaveTimeout) clearTimeout(this.leaveTimeout);
  }

  getModalPosition(task: Task) {
    const pos = this.getActualPosition(task);
    return { left: `calc(${pos.left} + ${pos.width} + 5px)` };
  }

  lightenColor(_color: string, _percent: number): string {
    // const num = parseInt(color.replace("#", ""), 16);
    // const amt = Math.round(2.55 * (percent * 100));
    // const R = (num >> 16) + amt;
    // const G = (num >> 8 & 0x00FF) + amt;
    // const B = (num & 0x0000FF) + amt;
    return "#EBE9E7";
  }
}

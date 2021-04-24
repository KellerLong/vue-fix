import {Options, Vue} from 'vue-decorator';
// import style from './Login.module.less';

@Options({})
export default class Login extends Vue {
  public render() {
      return (
        <div>
          <h1> hi </h1>
        </div>
    );
  }

  public onLogin() {
    this.$router.push('/platform');
  }
}
